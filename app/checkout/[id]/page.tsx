'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Shield, MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Elements } from '@stripe/react-stripe-js'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { getStripe } from '@/lib/stripe'
import StripeCheckoutForm from '@/components/StripeCheckoutForm'
import PayPalCheckoutButton from '@/components/PayPalCheckoutButton'

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  
  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe')
  
  // Booking details
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!user) {
      router.push(`/listing/${params.id}`)
      return
    }
    if (params.id) {
      loadListing(params.id as string)
    }
  }, [params.id, user, router])

  const loadListing = async (id: string) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Don't allow buying your own listing
      if (data.user_id === user?.id) {
        alert('You cannot purchase your own listing')
        router.push(`/listing/${id}`)
        return
      }

      setListing(data)
      
      // Create payment intent for Stripe
      await createPaymentIntent(data)
      
    } catch (error) {
      console.error('Error loading listing:', error)
      alert('Failed to load listing')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const createPaymentIntent = async (listing: any) => {
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: listing.price_amount,
          currency: listing.currency || 'USD',
          listingId: listing.id,
          userId: user?.id,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error('Error creating payment intent:', data.error)
        return
      }

      setClientSecret(data.clientSecret)
      console.log('✅ Payment intent created')
    } catch (error) {
      console.error('Error creating payment intent:', error)
    }
  }

  const handleSaveBookingDetails = async () => {
    if (!listing || !user) return

    try {
      // Save booking details to transaction
      const { error } = await supabase
        .from('transactions')
        .insert({
          buyer_id: user.id,
          seller_id: listing.user_id,
          listing_id: listing.id,
          amount: listing.price_amount,
          currency: listing.currency || 'USD',
          payment_method: paymentMethod,
          status: 'pending',
          booking_date: bookingDate || null,
          booking_time: bookingTime || null,
          notes: notes || null,
        })

      if (error) {
        console.error('Error saving booking:', error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 w-1/3 mb-6 rounded"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 mb-4 rounded-xl"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!listing) {
    return null
  }

  const total = listing.price_amount || 0
  const serviceFee = total * 0.05
  const finalTotal = total + serviceFee

  const stripeOptions = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#84cc16', // Lime-500
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        borderRadius: '8px',
      },
    },
  } : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-900 dark:text-gray-100" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Secure Checkout
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Complete your purchase safely</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Details */}
            {(listing.category === 'event' || listing.category === 'service') && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Calendar size={20} />
                  Booking Details
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-lime-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Time
                    </label>
                    <input
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-lime-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Any special requests or requirements..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-lime-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Payment Method
              </h2>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'stripe'
                      ? 'border-lime-500 bg-lime-50 dark:bg-lime-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield size={20} />
                    <span className="font-semibold">Stripe</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Card, Apple Pay, Google Pay
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'paypal'
                      ? 'border-lime-500 bg-lime-50 dark:bg-lime-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="font-semibold text-lg">PayPal</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    PayPal account
                  </div>
                </button>
              </div>

              {/* Stripe Payment Form */}
              {paymentMethod === 'stripe' && clientSecret && (
                <Elements stripe={getStripe()} options={stripeOptions}>
                  <StripeCheckoutForm
                    listingId={listing.id}
                    amount={finalTotal}
                    currency={listing.currency || 'USD'}
                    onSuccess={handleSaveBookingDetails}
                  />
                </Elements>
              )}

              {/* PayPal Buttons */}
              {paymentMethod === 'paypal' && (
                <PayPalScriptProvider
                  options={{
                    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
                    currency: listing.currency || 'USD',
                    intent: 'capture',
                  }}
                >
                  <div className="space-y-4">
                    <PayPalCheckoutButton
                      listingId={listing.id}
                      amount={finalTotal}
                      currency={listing.currency || 'USD'}
                      onSuccess={handleSaveBookingDetails}
                    />
                    
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Shield size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <strong className="font-medium block mb-1">Secure Payment</strong>
                        You'll be redirected to PayPal to complete your payment securely.
                      </div>
                    </div>
                  </div>
                </PayPalScriptProvider>
              )}

              {/* Loading State */}
              {paymentMethod === 'stripe' && !clientSecret && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Initializing secure payment...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Order Summary
              </h2>

              {/* Listing Info */}
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                {listing.media_url && (
                  <img
                    src={listing.media_url}
                    alt={listing.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                  {listing.title}
                </h3>
                {listing.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin size={14} />
                    {listing.location}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Listing Price</span>
                  <span>{total.toFixed(2)} {listing.currency || 'USD'}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span className="text-sm">Service Fee (5%)</span>
                  <span className="text-sm">{serviceFee.toFixed(2)} {listing.currency || 'USD'}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                <span>Total</span>
                <span>{finalTotal.toFixed(2)} {listing.currency || 'USD'}</span>
              </div>

              {/* Seller Info */}
              {listing.profiles && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Sold by</p>
                  <Link
                    href={`/profile/${listing.profiles.id}`}
                    className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-2 -mx-2 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-lime-400 to-lime-300 overflow-hidden">
                      {listing.profiles.avatar_url ? (
                        <img
                          src={listing.profiles.avatar_url}
                          alt={listing.profiles.name || listing.profiles.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black font-bold text-xs">
                          {(listing.profiles.name || listing.profiles.username || 'U')[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {listing.profiles.name || listing.profiles.username}
                      </div>
                      {listing.profiles.username && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          @{listing.profiles.username}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              )}

              {/* Payment Methods Accepted */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">We accept</p>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                    💳 Card
                  </div>
                  <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                    🍎 Apple Pay
                  </div>
                  <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                    💵 PayPal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

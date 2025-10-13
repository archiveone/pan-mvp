'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Shield, CreditCard } from 'lucide-react'

interface StripeCheckoutFormProps {
  listingId: string
  amount: number
  currency: string
  onSuccess?: () => void
}

export default function StripeCheckoutForm({ 
  listingId, 
  amount, 
  currency,
  onSuccess 
}: StripeCheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?listing=${listingId}&amount=${amount}`,
        },
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        setProcessing(false)
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Payment succeeded:', paymentIntent.id)
        
        // Redirect to success page
        router.push(`/checkout/success?transaction=${paymentIntent.id}&listing=${listingId}&amount=${amount}`)
        
        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'An error occurred during payment')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe Payment Element */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <PaymentElement 
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <Shield size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <strong className="font-medium block mb-1">Secure Payment</strong>
          Powered by Stripe. Your payment information is encrypted and secure. We never see or store your card details.
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-4 bg-gradient-to-r from-lime-400 to-lime-300 text-black font-semibold rounded-lg hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg"
      >
        {processing ? (
          <>
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            Processing Payment...
          </>
        ) : (
          <>
            <Shield size={20} />
            Pay {amount} {currency}
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        By confirming payment, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  )
}


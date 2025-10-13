'use client'

import React, { useState, useCallback } from 'react'
import { PaymentService } from '@/services/paymentService'
import { TransactionCategory, TransactionSubtype } from '@/types/transactions'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (transactionId: string) => void
  paymentData: {
    contentId: string
    title: string
    amount: number
    currency: string
    category: TransactionCategory
    subtype: TransactionSubtype
    metadata?: Record<string, any>
  }
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  paymentData
}: PaymentModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'bank'>('card')
  
  // Card details
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  
  // Billing address
  const [billingAddress, setBillingAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
    country: 'IE'
  })
  
  // Payment processing
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentIntent, setPaymentIntent] = useState<any>(null)

  const resetForm = useCallback(() => {
    setStep(1)
    setPaymentMethod('card')
    setCardNumber('')
    setExpiryDate('')
    setCvv('')
    setCardholderName('')
    setBillingAddress({
      street: '',
      city: '',
      postalCode: '',
      country: 'IE'
    })
    setError(null)
    setPaymentIntent(null)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const handlePaymentMethodChange = useCallback((method: 'card' | 'wallet' | 'bank') => {
    setPaymentMethod(method)
    setError(null)
  }, [])

  const formatCardNumber = useCallback((value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    // Add spaces every 4 digits
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
  }, [])

  const formatExpiryDate = useCallback((value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    // Add slash after 2 digits
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
    }
    return digits
  }, [])

  const validateCardDetails = useCallback(() => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      return 'Please enter a valid card number'
    }
    if (!expiryDate || expiryDate.length < 5) {
      return 'Please enter a valid expiry date'
    }
    if (!cvv || cvv.length < 3) {
      return 'Please enter a valid CVV'
    }
    if (!cardholderName.trim()) {
      return 'Please enter the cardholder name'
    }
    return null
  }, [cardNumber, expiryDate, cvv, cardholderName])

  const handleCreatePaymentIntent = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let paymentResult

      // Create payment intent based on category
      switch (paymentData.category) {
        case 'ticketing_attendance':
          paymentResult = await PaymentService.processTicketingPayment(
            'current_user_id', // Would get from auth context
            paymentData.contentId,
            paymentData.metadata?.ticketing_data || {},
            paymentData.amount,
            paymentData.currency
          )
          break

        case 'bookings_reservations':
          paymentResult = await PaymentService.processBookingPayment(
            'current_user_id',
            paymentData.contentId,
            paymentData.metadata?.booking_data || {},
            paymentData.amount,
            paymentData.currency
          )
          break

        case 'rentals_leases':
          paymentResult = await PaymentService.processRentalPayment(
            'current_user_id',
            paymentData.contentId,
            paymentData.metadata?.rental_data || {},
            paymentData.amount,
            paymentData.currency
          )
          break

        case 'donations_crowdfunding':
          paymentResult = await PaymentService.processDonationPayment(
            'current_user_id',
            paymentData.contentId,
            paymentData.metadata?.donation_data || {},
            paymentData.currency
          )
          break

        default:
          paymentResult = await PaymentService.processPurchasePayment(
            'current_user_id',
            paymentData.contentId,
            paymentData.metadata?.purchase_data || {},
            paymentData.amount,
            paymentData.currency
          )
      }

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Failed to create payment intent')
      }

      setPaymentIntent(paymentResult.payment_intent || paymentResult.checkout_session)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment intent')
    } finally {
      setLoading(false)
    }
  }, [paymentData])

  const handleConfirmPayment = useCallback(async () => {
    if (paymentMethod === 'card') {
      const validationError = validateCardDetails()
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setPaymentProcessing(true)
    setError(null)

    try {
      // In a real implementation, this would confirm the payment with Stripe
      // For now, we'll simulate a successful payment
      
      if (paymentIntent?.id) {
        const confirmResult = await PaymentService.confirmPayment(paymentIntent.id)
        
        if (!confirmResult.success) {
          throw new Error(confirmResult.error || 'Payment confirmation failed')
        }

        // Handle successful payment
        await PaymentService.handlePaymentSuccess(paymentIntent.id, {
          payment_method: paymentMethod,
          billing_address: billingAddress
        })

        onSuccess?.(paymentIntent.id)
        handleClose()
      } else {
        throw new Error('No payment intent available')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed')
    } finally {
      setPaymentProcessing(false)
    }
  }, [paymentMethod, validateCardDetails, paymentIntent, billingAddress, onSuccess, handleClose])

  // Calculate fees and total
  const calculateTotal = useCallback(() => {
    const fees = PaymentService.calculateFeesAndTaxes(paymentData.amount, paymentData.currency)
    return fees
  }, [paymentData.amount, paymentData.currency])

  if (!isOpen) return null

  const fees = calculateTotal()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Complete Payment</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Step 1: Payment Method Selection */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{paymentData.title}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{fees.subtotal.toFixed(2)} {paymentData.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (VAT):</span>
                    <span>{fees.tax_amount.toFixed(2)} {paymentData.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee:</span>
                    <span>{fees.processing_fee.toFixed(2)} {paymentData.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee:</span>
                    <span>{fees.platform_fee.toFixed(2)} {paymentData.currency}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total:</span>
                    <span>{fees.total.toFixed(2)} {paymentData.currency}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => handlePaymentMethodChange(e.target.value as 'card')}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <span className="mr-2">💳</span>
                      <span>Credit/Debit Card</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={(e) => handlePaymentMethodChange(e.target.value as 'wallet')}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <span className="mr-2">💰</span>
                      <span>Wallet Balance</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="bank"
                      checked={paymentMethod === 'bank'}
                      onChange={(e) => handlePaymentMethodChange(e.target.value as 'bank')}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <span className="mr-2">🏦</span>
                      <span>Bank Transfer</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Payment Method Specific Fields */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'wallet' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    You will pay using your wallet balance. Current balance: €0.00
                  </p>
                </div>
              )}

              {paymentMethod === 'bank' && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Bank transfer details will be provided after booking confirmation. 
                    Payment must be completed within 24 hours.
                  </p>
                </div>
              )}

              {/* Billing Address */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Billing Address</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={billingAddress.street}
                    onChange={(e) => setBillingAddress(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={billingAddress.city}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={billingAddress.postalCode}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={billingAddress.country}
                    onChange={(e) => setBillingAddress(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="IE">Ireland</option>
                    <option value="GB">United Kingdom</option>
                    <option value="US">United States</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Payment Confirmation */}
          {step === 2 && paymentIntent && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Ready</h3>
                <p className="text-gray-600">
                  Your payment intent has been created. Click below to complete the payment.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Payment ID:</span>
                    <span className="font-mono text-xs">{paymentIntent.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>{fees.total.toFixed(2)} {paymentData.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-orange-600">Pending</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-3">
            {step === 1 ? (
              <button
                onClick={handleCreatePaymentIntent}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Continue to Payment'}
              </button>
            ) : (
              <button
                onClick={handleConfirmPayment}
                disabled={paymentProcessing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {paymentProcessing ? 'Processing...' : 'Complete Payment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
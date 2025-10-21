'use client'
// @ts-nocheck

import React, { useState, useEffect, useCallback } from 'react'
import { BookingService } from '@/services/bookingService'
import { PaymentService } from '@/services/paymentService'
// import { BookingSlot, BookingRequest } from '@/services/bookingService'
type BookingSlot = any
type BookingRequest = any

interface BookingInterfaceProps {
  contentId: string
  title: string
  price: number
  currency: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: (bookingId: string) => void
}

export default function BookingInterface({
  contentId,
  title,
  price,
  currency,
  isOpen,
  onClose,
  onSuccess
}: BookingInterfaceProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Booking data
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [partySize, setPartySize] = useState(1)
  const [specialRequests, setSpecialRequests] = useState('')
  
  // Contact info
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  
  // Availability data
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card')
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  const resetForm = useCallback(() => {
    setStep(1)
    setSelectedDate('')
    setSelectedTime('')
    setPartySize(1)
    setSpecialRequests('')
    setContactName('')
    setContactEmail('')
    setContactPhone('')
    setError(null)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  // Load available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedDate, contentId])

  const loadAvailableSlots = useCallback(async () => {
    setLoadingSlots(true)
    setError(null)

    try {
      // Get availability for the next 30 days from selected date
      const endDate = new Date(selectedDate)
      endDate.setDate(endDate.getDate() + 30)

      const result = await BookingService.checkAvailability(
        contentId,
        selectedDate,
        endDate.toISOString().split('T')[0]
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to load availability')
      }

      setAvailableSlots((result as any).slots || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability')
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [selectedDate, contentId])

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date)
    setSelectedTime('') // Reset time when date changes
  }, [])

  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time)
  }, [])

  const handleSubmitBooking = useCallback(async () => {
    if (!selectedDate || !selectedTime || !contactName || !contactEmail) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create booking request
      const bookingResult = await BookingService.createBookingRequest(
        'current_user_id', // Would get from auth context
        contentId,
        {
          date: selectedDate,
          start_time: selectedTime,
          end_time: selectedTime, // Would calculate based on duration
          party_size: partySize,
          special_requests: specialRequests || undefined,
          contact_info: {
            name: contactName,
            email: contactEmail,
            phone: contactPhone || undefined
          }
        }
      )

      if (!bookingResult.success || !bookingResult.booking) {
        throw new Error(bookingResult.error || 'Failed to create booking')
      }

      // Process payment
      if (price > 0) {
        setPaymentProcessing(true)
        
        const paymentResult = await PaymentService.processBookingPayment(
          'current_user_id',
          contentId,
          {
            booking_date: selectedDate,
            start_time: selectedTime,
            end_time: selectedTime,
            party_size: partySize,
            special_requests: specialRequests
          },
          price * partySize,
          currency
        )

        if (!paymentResult.success) {
          throw new Error(paymentResult.error || 'Payment processing failed')
        }

        // Confirm booking after successful payment
        const confirmResult = await BookingService.confirmBooking(
          bookingResult.booking.id,
          paymentResult.payment_intent?.id
        )

        if (!confirmResult.success) {
          throw new Error('Failed to confirm booking')
        }
      }

      // Success
      onSuccess?.(bookingResult.booking.id)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
      setPaymentProcessing(false)
    }
  }, [
    selectedDate, selectedTime, contactName, contactEmail, contactPhone,
    partySize, specialRequests, price, currency, contentId, onSuccess, handleClose
  ])

  // Get available dates (next 30 days)
  const getAvailableDates = useCallback(() => {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    
    return dates
  }, [])

  // Get time slots for selected date
  const getTimeSlotsForDate = useCallback((date: string) => {
    return availableSlots.filter(slot => slot.date === date)
  }, [availableSlots])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Book {title}</h2>
            <p className="text-gray-600">{price > 0 ? `${price} ${currency} per person` : 'Free'}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center p-4 border-b">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Step 1: Date and Time Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Date & Time</h3>
                
                {/* Date Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Available Dates
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {getAvailableDates().map((date) => {
                      const dateObj = new Date(date)
                      const dayName = dateObj.toLocaleDateString('en', { weekday: 'short' })
                      const dayNumber = dateObj.getDate()
                      const monthName = dateObj.toLocaleDateString('en', { month: 'short' })
                      
                      return (
                        <button
                          key={date}
                          onClick={() => handleDateSelect(date)}
                          className={`p-3 text-center border rounded-lg ${
                            selectedDate === date
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="text-xs text-gray-500">{dayName}</div>
                          <div className="font-medium">{dayNumber}</div>
                          <div className="text-xs text-gray-500">{monthName}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Available Times
                    </label>
                    {loadingSlots ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading available times...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {getTimeSlotsForDate(selectedDate).map((slot) => (
                          <button
                            key={slot.start_time}
                            onClick={() => handleTimeSelect(slot.start_time)}
                            disabled={!slot.is_available}
                            className={`p-3 text-center border rounded-lg ${
                              selectedTime === slot.start_time
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : slot.is_available
                                  ? 'border-gray-300 hover:border-gray-400'
                                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <div className="font-medium">{slot.start_time}</div>
                            <div className="text-xs">
                              {slot.current_bookings}/{slot.max_capacity}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Booking Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Party Size *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={partySize}
                      onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Price
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      {price > 0 ? `${(price * partySize).toFixed(2)} ${currency}` : 'Free'}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any special requests or requirements..."
                  />
                </div>

                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Contact Information</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your@email.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+353 1 234 5678"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment and Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment & Confirmation</h3>
                
                {/* Booking Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{new Date(selectedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Party Size:</span>
                      <span>{partySize} {partySize === 1 ? 'person' : 'people'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price per person:</span>
                      <span>{price > 0 ? `${price} ${currency}` : 'Free'}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total:</span>
                      <span>{price > 0 ? `${(price * partySize).toFixed(2)} ${currency}` : 'Free'}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                {price > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Payment Method
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'card')}
                          className="mr-3"
                        />
                        <span>Credit/Debit Card</span>
                      </label>
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          value="wallet"
                          checked={paymentMethod === 'wallet'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'wallet')}
                          className="mr-3"
                        />
                        <span>Wallet Balance</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Terms */}
                <div className="mt-6">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      required
                      className="mt-1 mr-3"
                    />
                    <span className="text-sm text-gray-600">
                      I agree to the booking terms and conditions and understand that this booking is non-refundable.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <button
            onClick={step > 1 ? () => setStep(step - 1) : handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          
          <div className="flex items-center space-x-3">
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!selectedDate || !selectedTime}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmitBooking}
                disabled={loading || paymentProcessing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading || paymentProcessing ? 'Processing...' : 'Confirm Booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}







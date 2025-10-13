'use client'

import { PayPalButtons } from '@paypal/react-paypal-js'
import { useRouter } from 'next/navigation'

interface PayPalCheckoutButtonProps {
  listingId: string
  amount: number
  currency: string
  onSuccess?: () => void
}

export default function PayPalCheckoutButton({
  listingId,
  amount,
  currency,
  onSuccess
}: PayPalCheckoutButtonProps) {
  const router = useRouter()

  const createOrder = async () => {
    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          listingId,
        }),
      })

      const data = await response.json()
      return data.orderId
    } catch (error) {
      console.error('Error creating PayPal order:', error)
      throw error
    }
  }

  const onApprove = async (data: any) => {
    console.log('✅ PayPal payment approved:', data.orderID)
    
    // Redirect to success page
    router.push(`/checkout/success?transaction=${data.orderID}&listing=${listingId}&amount=${amount}&method=paypal`)
    
    if (onSuccess) {
      onSuccess()
    }
  }

  const onError = (err: any) => {
    console.error('❌ PayPal payment error:', err)
    alert('Payment failed. Please try again.')
  }

  return (
    <PayPalButtons
      createOrder={createOrder}
      onApprove={onApprove}
      onError={onError}
      style={{
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'pay',
      }}
    />
  )
}


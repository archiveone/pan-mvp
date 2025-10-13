import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    
    if (!publishableKey) {
      console.warn('⚠️ Stripe publishable key not found. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env')
      return Promise.resolve(null)
    }
    
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}

export const formatAmountForStripe = (amount: number, currency: string): number => {
  // Stripe expects amounts in smallest currency unit (cents for USD)
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  
  const parts = numberFormat.formatToParts(amount)
  let zeroDecimalCurrency = true
  
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
    }
  }
  
  return zeroDecimalCurrency ? amount : Math.round(amount * 100)
}

export const formatAmountFromStripe = (amount: number, currency: string): number => {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  
  const parts = numberFormat.formatToParts(amount)
  let zeroDecimalCurrency = true
  
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
    }
  }
  
  return zeroDecimalCurrency ? amount : amount / 100
}


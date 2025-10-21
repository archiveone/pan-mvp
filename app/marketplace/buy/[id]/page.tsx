'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Star, Heart, Share2, Shield, Truck, CreditCard, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MarketplaceService } from '@/services/marketplaceService';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

export default function MarketplaceBuyPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const [listing, setListing] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'shipping' | 'digital' | 'local_delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    instructions: '',
  });
  const [customerNotes, setCustomerNotes] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (params?.id) {
      loadListingData();
    }
  }, [params?.id]);

  const loadListingData = async () => {
    if (!params?.id) return;
    
    try {
      const result = await MarketplaceService.getListing(params.id as string);
      
      if (result.success && result.listing) {
        setListing(result.listing);
        setSeller((result.listing as any).seller);
      } else {
        throw new Error(result.error || 'Failed to load listing');
      }
    } catch (error: any) {
      console.error('Error loading listing:', error);
      alert(`Error loading listing: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!listing) return 0;
    
    let total = listing.price * quantity;
    
    if (deliveryMethod !== 'pickup' && listing.delivery_fee) {
      total += listing.delivery_fee;
    }
    
    if (!listing.tax_included && listing.tax_rate) {
      total += total * (listing.tax_rate / 100);
    }
    
    return total;
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= listing.minimum_order && newQuantity <= listing.maximum_order) {
      setQuantity(newQuantity);
    }
  };

  const proceedToCheckout = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentStep(2);
  };

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user || !stripe || !elements || !params?.id) return;

    setProcessing(true);

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(calculateTotal() * 100), // Convert to cents
          currency: 'usd',
          userId: user.id,
          metadata: { 
            type: 'marketplace_purchase',
            listingId: params.id,
            quantity: quantity
          }
        }),
      });

      const { clientSecret } = await response.json();

      if (!clientSecret) {
        throw new Error('No client secret received');
      }

      // Create order
      const orderResult = await MarketplaceService.createOrder({
        buyer_id: user.id,
        listing_id: params.id as string,
        quantity: quantity,
        delivery_method: deliveryMethod,
        delivery_address: deliveryMethod !== 'pickup' ? deliveryAddress : undefined,
        pickup_address: deliveryMethod === 'pickup' ? deliveryAddress : undefined,
        customer_notes: customerNotes,
        payment_intent_id: clientSecret.split('_secret')[0],
      });

      if (!orderResult.success || !orderResult.order) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      setOrder(orderResult.order);

      // Confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/order/${orderResult.order.id}/success`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      setCurrentStep(3);
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Listing Not Found</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Purchase Item</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Heart size={20} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Item Details</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div className={`h-full bg-blue-600 transition-all duration-300 ${
                currentStep >= 2 ? 'w-full' : 'w-0'
              }`} />
            </div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Checkout</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div className={`h-full bg-blue-600 transition-all duration-300 ${
                currentStep >= 3 ? 'w-full' : 'w-0'
              }`} />
            </div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Item Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Item Images */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {listing.images && listing.images.length > 0 ? (
                      listing.images.map((image: string, index: number) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${listing.title} ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      ))
                    ) : (
                      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">No images available</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Item Details */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center">
                      {listing.rating_average ? (
                        <>
                          <Star size={16} className="text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm text-gray-600">
                            {listing.rating_average} ({listing.rating_count} reviews)
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">No reviews yet</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{listing.category}</span>
                  </div>

                  <div className="text-3xl font-bold text-gray-900 mb-4">
                    ${listing.price}
                    {listing.original_price > listing.price && (
                      <span className="text-lg text-gray-500 line-through ml-2">
                        ${listing.original_price}
                      </span>
                    )}
                  </div>

                  <div className="prose max-w-none">
                    <p className="text-gray-700 mb-4">{listing.description}</p>
                  </div>

                  {/* Features */}
                  {listing.features && listing.features.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Features</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {listing.features.map((feature: string, index: number) => (
                          <li key={index} className="text-gray-700">{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Seller Info */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {seller?.name?.charAt(0) || 'S'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{seller?.name || 'Unknown Seller'}</h4>
                        <p className="text-sm text-gray-500">Member since 2024</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quantity & Purchase */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Options</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= listing.minimum_order}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= listing.maximum_order}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {listing.quantity_available} available • Min: {listing.minimum_order} • Max: {listing.maximum_order}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Method
                      </label>
                      <div className="space-y-2">
                        {listing.delivery_methods.map((method: string) => (
                          <label key={method} className="flex items-center">
                            <input
                              type="radio"
                              name="deliveryMethod"
                              value={method}
                              checked={deliveryMethod === method}
                              onChange={(e) => setDeliveryMethod(e.target.value as any)}
                              className="mr-2"
                            />
                            <span className="capitalize">{method.replace('_', ' ')}</span>
                            {method !== 'pickup' && listing.delivery_fee && (
                              <span className="ml-2 text-sm text-gray-500">
                                (+${listing.delivery_fee})
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    {deliveryMethod !== 'pickup' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Address
                        </label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Street Address"
                            value={deliveryAddress.street}
                            onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="City"
                              value={deliveryAddress.city}
                              onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="State"
                              value={deliveryAddress.state}
                              onChange={(e) => setDeliveryAddress(prev => ({ ...prev, state: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Postal Code"
                              value={deliveryAddress.postal_code}
                              onChange={(e) => setDeliveryAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Country"
                              value={deliveryAddress.country}
                              onChange={(e) => setDeliveryAddress(prev => ({ ...prev, country: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <textarea
                            placeholder="Delivery Instructions (Optional)"
                            value={deliveryAddress.instructions}
                            onChange={(e) => setDeliveryAddress(prev => ({ ...prev, instructions: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes for Seller (Optional)
                      </label>
                      <textarea
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Any special requests or questions..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Checkout */}
            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Information</h2>
                
                <form onSubmit={handlePaymentSubmit}>
                  <div className="mb-6">
                    <PaymentElement />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!stripe || processing}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {processing && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>}
                    <CreditCard size={20} className="mr-2" />
                    {processing ? 'Processing...' : `Pay $${calculateTotal().toFixed(2)}`}
                  </button>
                </form>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && order && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
                <p className="text-gray-600 mb-6">
                  Your order has been successfully placed. You will receive a confirmation email shortly.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Order Details</h3>
                  <p className="text-lg font-mono text-blue-600">{order.order_number}</p>
                </div>
                
                <div className="flex space-x-4 justify-center">
                  <button
                    onClick={() => router.push(`/order/${order.id}`)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    View Order Details
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>{listing.title}</span>
                    <span>${listing.price}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Quantity</span>
                    <span>{quantity}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${(listing.price * quantity).toFixed(2)}</span>
                  </div>
                  
                  {deliveryMethod !== 'pickup' && listing.delivery_fee && (
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>${listing.delivery_fee.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {!listing.tax_included && listing.tax_rate && (
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${((listing.price * quantity) * (listing.tax_rate / 100)).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={proceedToCheckout}
                  className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                >
                  <CreditCard size={20} className="mr-2" />
                  Proceed to Checkout
                </button>

                <div className="mt-6 space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Shield size={16} className="mr-2" />
                    <span>Secure payment</span>
                  </div>
                  <div className="flex items-center">
                    <Truck size={16} className="mr-2" />
                    <span>Fast delivery</span>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>{listing.title}</span>
                    <span>${listing.price}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Quantity</span>
                    <span>{quantity}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${(listing.price * quantity).toFixed(2)}</span>
                  </div>
                  
                  {deliveryMethod !== 'pickup' && listing.delivery_fee && (
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>${listing.delivery_fee.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {!listing.tax_included && listing.tax_rate && (
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${((listing.price * quantity) * (listing.tax_rate / 100)).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

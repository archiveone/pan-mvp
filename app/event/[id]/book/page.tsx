'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Clock, Users, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TicketingService, Event, Ticket, Booking } from '@/services/ticketingService';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';

export default function EventBookingPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTickets, setSelectedTickets] = useState<{ [ticketId: string]: number }>({});
  const [attendeeDetails, setAttendeeDetails] = useState<Array<{
    first_name: string;
    last_name: string;
    email: string;
    ticket_type: string;
    ticket_title: string;
  }>>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (params?.id) {
      loadEventData();
    }
  }, [params?.id]);

  const loadEventData = async () => {
    if (!params?.id) return;
    
    try {
      // Load event details (simplified - in real app, you'd have an event service)
      const { data: eventData, error: eventError} = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .single();

      if (eventError) throw eventError;

      // Load available tickets
      const ticketsResult = await TicketingService.getEventTickets(params.id as string);
      
      if (ticketsResult.success && ticketsResult.tickets) {
        setTickets(ticketsResult.tickets);
        setEvent(eventData as Event);
      } else {
        throw new Error(ticketsResult.error || 'Failed to load tickets');
      }
    } catch (error: any) {
      console.error('Error loading event data:', error);
      alert(`Error loading event: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketQuantityChange = (ticketId: string, quantity: number) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketId]: Math.max(0, quantity)
    }));
  };

  const calculateTotal = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketId, quantity]) => {
      const ticket = tickets.find(t => t.id === ticketId);
      return total + (ticket ? ticket.price * quantity : 0);
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, quantity) => sum + quantity, 0);
  };

  const handleAttendeeDetailChange = (index: number, field: string, value: string) => {
    setAttendeeDetails(prev => prev.map((detail, i) => 
      i === index ? { ...detail, [field]: value } : detail
    ));
  };

  const proceedToPayment = () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const totalTickets = getTotalTickets();
    if (totalTickets === 0) {
      alert('Please select at least one ticket');
      return;
    }

    // Create attendee details array
    const details: Array<{
      first_name: string;
      last_name: string;
      email: string;
      ticket_type: string;
      ticket_title: string;
    }> = [];
    let detailIndex = 0;
    
    for (const [ticketId, quantity] of Object.entries(selectedTickets)) {
      if (quantity > 0) {
        const ticket = tickets.find(t => t.id === ticketId);
        for (let i = 0; i < quantity; i++) {
          details.push({
            first_name: '',
            last_name: '',
            email: user.email || '',
            ticket_type: ticket?.ticket_type || 'general',
            ticket_title: ticket?.title || '',
          });
        }
      }
    }
    
    setAttendeeDetails(details);
    setCurrentStep(2);
  };

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user || !stripe || !elements || !params?.id) return;

    setProcessing(true);

    try {
      // Create payment intent first
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(calculateTotal() * 100), // Convert to cents
          currency: 'usd',
          userId: user.id,
          metadata: { 
            type: 'event_booking',
            eventId: params.id,
            ticketQuantities: JSON.stringify(selectedTickets)
          }
        }),
      });

      const { clientSecret } = await response.json();

      if (!clientSecret) {
        throw new Error('No client secret received');
      }

      // Create booking
      const ticketId = Object.keys(selectedTickets).find(id => selectedTickets[id] > 0);
      if (!ticketId) throw new Error('No tickets selected');

      const bookingResult = await TicketingService.createBooking({
        ticket_id: ticketId,
        buyer_id: user.id,
        quantity: getTotalTickets(),
        attendee_details: attendeeDetails,
        payment_intent_id: clientSecret.split('_secret')[0], // Extract payment intent ID
      });

      if (!bookingResult.success || !bookingResult.booking) {
        throw new Error(bookingResult.error || 'Failed to create booking');
      }

      setBooking(bookingResult.booking);

      // Confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/booking/${bookingResult.booking.id}/success`,
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

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Book Tickets</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h2>
          <p className="text-gray-600 mb-4">{event.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-gray-600">
              <Calendar size={20} className="mr-2" />
              <span>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin size={20} className="mr-2" />
              <span>{event.venue_name}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Users size={20} className="mr-2" />
              <span>Capacity: {event.venue_capacity}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock size={20} className="mr-2" />
              <span>{event.category}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Select Tickets</span>
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
              <span className="ml-2 text-sm font-medium">Payment</span>
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

        {/* Step 1: Ticket Selection */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Select Tickets</h3>
            
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{ticket.title}</h4>
                      <p className="text-gray-600 text-sm mt-1">{ticket.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          Available: {ticket.quantity_available}
                        </span>
                        <span className="text-sm text-gray-500">
                          Max per person: {ticket.max_per_person}
                        </span>
                      </div>
                      {ticket.includes.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Includes:</p>
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                            {ticket.includes.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-gray-900">
                        ${ticket.price}
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => handleTicketQuantityChange(ticket.id, (selectedTickets[ticket.id] || 0) - 1)}
                          disabled={!selectedTickets[ticket.id]}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">
                          {selectedTickets[ticket.id] || 0}
                        </span>
                        <button
                          onClick={() => handleTicketQuantityChange(ticket.id, (selectedTickets[ticket.id] || 0) + 1)}
                          disabled={(selectedTickets[ticket.id] || 0) >= ticket.quantity_available || (selectedTickets[ticket.id] || 0) >= ticket.max_per_person}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            {getTotalTickets() > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h4>
                <div className="space-y-2">
                  {Object.entries(selectedTickets).map(([ticketId, quantity]) => {
                    if (quantity === 0) return null;
                    const ticket = tickets.find(t => t.id === ticketId);
                    return (
                      <div key={ticketId} className="flex justify-between">
                        <span>{ticket?.title} × {quantity}</span>
                        <span>${ticket ? ticket.price * quantity : 0}</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${calculateTotal()}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={proceedToPayment}
                  className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                >
                  <CreditCard size={20} className="mr-2" />
                  Proceed to Payment
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Payment */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Information</h3>
            
            <form onSubmit={handlePaymentSubmit}>
              <div className="mb-6">
                <PaymentElement />
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h4>
                <div className="space-y-2">
                  {Object.entries(selectedTickets).map(([ticketId, quantity]) => {
                    if (quantity === 0) return null;
                    const ticket = tickets.find(t => t.id === ticketId);
                    return (
                      <div key={ticketId} className="flex justify-between">
                        <span>{ticket?.title} × {quantity}</span>
                        <span>${ticket ? ticket.price * quantity : 0}</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${calculateTotal()}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={!stripe || processing}
                  className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processing && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>}
                  <CreditCard size={20} className="mr-2" />
                  {processing ? 'Processing...' : `Pay $${calculateTotal()}`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && booking && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Booking Confirmed!</h3>
            <p className="text-gray-600 mb-6">
              Your tickets have been successfully booked. You will receive a confirmation email shortly.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Booking Reference</h4>
              <p className="text-lg font-mono text-blue-600">{booking.booking_reference}</p>
            </div>
            
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => router.push(`/booking/${booking.id}`)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                View Booking Details
              </button>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

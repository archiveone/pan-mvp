'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Clock, Users, DollarSign, Upload, Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TicketingService, Event, Ticket } from '@/services/ticketingService';
import MediaUploader from '@/components/MediaUploader';

interface TicketFormData {
  ticket_type: Ticket['ticket_type'];
  title: string;
  description: string;
  price: number;
  quantity_available: number;
  max_per_person: number;
  sale_start_date: string;
  sale_end_date: string;
  refund_policy: Ticket['refund_policy'];
  transfer_allowed: boolean;
  resale_allowed: boolean;
  includes: string[];
  age_restriction?: number;
}

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Event form data
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    category: 'concert' as Event['category'],
    event_type: 'single' as Event['event_type'],
    venue_name: '',
    venue_address: '',
    venue_capacity: '',
    start_date: '',
    end_date: '',
    timezone: 'UTC',
    organizer_name: '',
    organizer_email: '',
    organizer_phone: '',
    image_url: '',
  });

  // Ticket forms data
  const [tickets, setTickets] = useState<TicketFormData[]>([]);
  const [newTicket, setNewTicket] = useState<TicketFormData>({
    ticket_type: 'general',
    title: '',
    description: '',
    price: 0,
    quantity_available: 0,
    max_per_person: 10,
    sale_start_date: '',
    sale_end_date: '',
    refund_policy: 'no_refund',
    transfer_allowed: false,
    resale_allowed: false,
    includes: [],
    age_restriction: undefined,
  });

  const handleEventDataChange = (field: string, value: any) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  const addTicket = () => {
    if (newTicket.title && newTicket.price > 0) {
      setTickets(prev => [...prev, newTicket]);
      setNewTicket({
        ticket_type: 'general',
        title: '',
        description: '',
        price: 0,
        quantity_available: 0,
        max_per_person: 10,
        sale_start_date: '',
        sale_end_date: '',
        refund_policy: 'no_refund',
        transfer_allowed: false,
        resale_allowed: false,
        includes: [],
        age_restriction: undefined,
      });
    }
  };

  const removeTicket = (index: number) => {
    setTickets(prev => prev.filter((_, i) => i !== index));
  };

  const handleTicketChange = (index: number, field: string, value: any) => {
    setTickets(prev => prev.map((ticket, i) => 
      i === index ? { ...ticket, [field]: value } : ticket
    ));
  };

  const handleNewTicketChange = (field: string, value: any) => {
    setNewTicket(prev => ({ ...prev, [field]: value }));
  };

  const addIncludeItem = (index: number, item: string) => {
    if (item.trim()) {
      setTickets(prev => prev.map((ticket, i) => 
        i === index 
          ? { ...ticket, includes: [...ticket.includes, item.trim()] }
          : ticket
      ));
    }
  };

  const removeIncludeItem = (index: number, itemIndex: number) => {
    setTickets(prev => prev.map((ticket, i) => 
      i === index 
        ? { ...ticket, includes: ticket.includes.filter((_, j) => j !== itemIndex) }
        : ticket
    ));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Create event
      const eventResult = await TicketingService.createEvent({
        ...eventData,
        venue_capacity: parseInt(eventData.venue_capacity),
        organizer_id: user.id,
        status: 'draft',
      });

      if (!eventResult.success || !eventResult.event) {
        throw new Error(eventResult.error || 'Failed to create event');
      }

      // Create tickets
      for (const ticketData of tickets) {
        const ticketResult = await TicketingService.createTicket({
          event_id: eventResult.event.id,
          ticket_type: ticketData.ticket_type,
          title: ticketData.title,
          description: ticketData.description,
          price: ticketData.price,
          currency: 'USD',
          quantity_available: ticketData.quantity_available,
          quantity_sold: 0,
          max_per_person: ticketData.max_per_person,
          sale_start_date: ticketData.sale_start_date,
          sale_end_date: ticketData.sale_end_date,
          event_start_date: eventData.start_date,
          event_end_date: eventData.end_date,
          venue_name: eventData.venue_name,
          venue_address: eventData.venue_address,
          venue_capacity: parseInt(eventData.venue_capacity),
          age_restriction: ticketData.age_restriction,
          refund_policy: ticketData.refund_policy,
          transfer_allowed: ticketData.transfer_allowed,
          resale_allowed: ticketData.resale_allowed,
          includes: ticketData.includes,
          terms_conditions: '',
          created_by: user.id,
          status: 'active',
        });

        if (!ticketResult.success) {
          console.error('Failed to create ticket:', ticketResult.error);
        }
      }

      alert('Event created successfully!');
      router.push(`/event/${eventResult.event.id}`);
    } catch (error: any) {
      console.error('Error creating event:', error);
      alert(`Error creating event: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You must be logged in to create events.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
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
              <h1 className="text-xl font-semibold text-gray-900">Create Event</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Step {currentStep} of 3
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Event Details</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div className={`h-full bg-blue-600 transition-all duration-300 ${
                currentStep >= 2 ? 'w-full' : 'w-0'
              }`} />
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Tickets</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div className={`h-full bg-blue-600 transition-all duration-300 ${
                currentStep >= 3 ? 'w-full' : 'w-0'
              }`} />
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Review</span>
            </div>
          </div>
        </div>

        {/* Step 1: Event Details */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Event Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={eventData.title}
                  onChange={(e) => handleEventDataChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={eventData.description}
                  onChange={(e) => handleEventDataChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your event"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={eventData.category}
                    onChange={(e) => handleEventDataChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="concert">Concert</option>
                    <option value="conference">Conference</option>
                    <option value="workshop">Workshop</option>
                    <option value="sports">Sports</option>
                    <option value="theater">Theater</option>
                    <option value="festival">Festival</option>
                    <option value="exhibition">Exhibition</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type *
                  </label>
                  <select
                    value={eventData.event_type}
                    onChange={(e) => handleEventDataChange('event_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="single">Single Event</option>
                    <option value="recurring">Recurring Event</option>
                    <option value="series">Event Series</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  value={eventData.venue_name}
                  onChange={(e) => handleEventDataChange('venue_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter venue name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Address *
                </label>
                <input
                  type="text"
                  value={eventData.venue_address}
                  onChange={(e) => handleEventDataChange('venue_address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter venue address"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Capacity *
                  </label>
                  <input
                    type="number"
                    value={eventData.venue_capacity}
                    onChange={(e) => handleEventDataChange('venue_capacity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventData.start_date}
                    onChange={(e) => handleEventDataChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventData.end_date}
                    onChange={(e) => handleEventDataChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organizer Name *
                  </label>
                  <input
                    type="text"
                    value={eventData.organizer_name}
                    onChange={(e) => handleEventDataChange('organizer_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your organization name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organizer Email *
                  </label>
                  <input
                    type="email"
                    value={eventData.organizer_email}
                    onChange={(e) => handleEventDataChange('organizer_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contact@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organizer Phone
                  </label>
                  <input
                    type="tel"
                    value={eventData.organizer_phone}
                    onChange={(e) => handleEventDataChange('organizer_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Image
                </label>
                <MediaUploader
                  onUploadComplete={(files) => {
                    if (files.length > 0) {
                      handleEventDataChange('image_url', files[0].url);
                    }
                  }}
                  accept="image/*"
                  multiple={false}
                  maxFiles={1}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Tickets */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Ticket Types</h2>
            
            {/* Existing Tickets */}
            {tickets.map((ticket, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">{ticket.title}</h3>
                  <button
                    onClick={() => removeTicket(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={ticket.ticket_type}
                      onChange={(e) => handleTicketChange(index, 'ticket_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="general">General</option>
                      <option value="vip">VIP</option>
                      <option value="early_bird">Early Bird</option>
                      <option value="group">Group</option>
                      <option value="student">Student</option>
                      <option value="senior">Senior</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      value={ticket.price}
                      onChange={(e) => handleTicketChange(index, 'price', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={ticket.quantity_available}
                      onChange={(e) => handleTicketChange(index, 'quantity_available', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Ticket */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Add New Ticket Type</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Title *
                  </label>
                  <input
                    type="text"
                    value={newTicket.title}
                    onChange={(e) => handleNewTicketChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., General Admission"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={newTicket.ticket_type}
                      onChange={(e) => handleNewTicketChange('ticket_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="vip">VIP</option>
                      <option value="early_bird">Early Bird</option>
                      <option value="group">Group</option>
                      <option value="student">Student</option>
                      <option value="senior">Senior</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                    <input
                      type="number"
                      value={newTicket.price}
                      onChange={(e) => handleNewTicketChange('price', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      value={newTicket.quantity_available}
                      onChange={(e) => handleNewTicketChange('quantity_available', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTicket.description}
                    onChange={(e) => handleNewTicketChange('description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe what's included with this ticket"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sale Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={newTicket.sale_start_date}
                      onChange={(e) => handleNewTicketChange('sale_start_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sale End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={newTicket.sale_end_date}
                      onChange={(e) => handleNewTicketChange('sale_end_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Policy
                  </label>
                  <select
                    value={newTicket.refund_policy}
                    onChange={(e) => handleNewTicketChange('refund_policy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="no_refund">No Refunds</option>
                    <option value="full_refund_48h">Full Refund (48 hours)</option>
                    <option value="partial_refund_7d">Partial Refund (7 days)</option>
                    <option value="full_refund_30d">Full Refund (30 days)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newTicket.transfer_allowed}
                      onChange={(e) => handleNewTicketChange('transfer_allowed', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Transfer Allowed</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newTicket.resale_allowed}
                      onChange={(e) => handleNewTicketChange('resale_allowed', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Resale Allowed</span>
                  </label>
                </div>

                <button
                  onClick={addTicket}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                >
                  <Plus size={20} className="mr-2" />
                  Add Ticket Type
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Review Your Event</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Event Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p><strong>Title:</strong> {eventData.title}</p>
                  <p><strong>Category:</strong> {eventData.category}</p>
                  <p><strong>Venue:</strong> {eventData.venue_name}</p>
                  <p><strong>Address:</strong> {eventData.venue_address}</p>
                  <p><strong>Capacity:</strong> {eventData.venue_capacity} people</p>
                  <p><strong>Date:</strong> {new Date(eventData.start_date).toLocaleDateString()} - {new Date(eventData.end_date).toLocaleDateString()}</p>
                  <p><strong>Organizer:</strong> {eventData.organizer_name}</p>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Ticket Types ({tickets.length})</h3>
                {tickets.map((ticket, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 mb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p><strong>{ticket.title}</strong> ({ticket.ticket_type})</p>
                        <p>${ticket.price} × {ticket.quantity_available} tickets</p>
                        <p>Refund Policy: {ticket.refund_policy}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">${ticket.price * ticket.quantity_available}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <button
            onClick={nextStep}
            disabled={loading || (currentStep === 1 && (!eventData.title || !eventData.description)) || (currentStep === 2 && tickets.length === 0)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            {currentStep === 3 ? 'Create Event' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

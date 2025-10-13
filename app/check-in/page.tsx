'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, QrCode, Search, CheckCircle, XCircle, Clock, User, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TicketingService } from '@/services/ticketingService';

export default function CheckInPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookingReference, setBookingReference] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSearchBooking = async () => {
    if (!bookingReference.trim()) {
      setError('Please enter a booking reference');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await TicketingService.getBookingByReference(bookingReference.trim());
      
      if (result.success && result.booking) {
        setBooking(result.booking);
      } else {
        setError(result.error || 'Booking not found');
        setBooking(null);
      }
    } catch (error: any) {
      setError(error.message || 'Error searching for booking');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (attendeeId: string) => {
    if (!booking) return;

    try {
      const result = await TicketingService.checkInAttendee(booking.id, attendeeId);
      
      if (result.success) {
        setSuccess('Attendee checked in successfully!');
        // Reload booking data
        handleSearchBooking();
      } else {
        setError(result.error || 'Failed to check in attendee');
      }
    } catch (error: any) {
      setError(error.message || 'Error checking in attendee');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'attended':
        return 'text-blue-600 bg-blue-100';
      case 'no_show':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

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
              <h1 className="text-xl font-semibold text-gray-900">Check-In System</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Find Booking</h2>
          
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={bookingReference}
                onChange={(e) => setBookingReference(e.target.value)}
                placeholder="Enter booking reference (e.g., BK1234567890)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearchBooking()}
              />
            </div>
            <button
              onClick={handleSearchBooking}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Search size={20} className="mr-2" />
              )}
              Search
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <XCircle size={20} className="text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle size={20} className="text-green-500 mr-2" />
              <span className="text-green-700">{success}</span>
            </div>
          )}
        </div>

        {/* Booking Details */}
        {booking && (
          <div className="space-y-6">
            {/* Booking Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600">
                  <Calendar size={20} className="mr-2" />
                  <span>Reference: {booking.booking_reference}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock size={20} className="mr-2" />
                  <span>Booked: {formatDate(booking.booking_date)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <User size={20} className="mr-2" />
                  <span>Quantity: {booking.quantity} ticket(s)</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin size={20} className="mr-2" />
                  <span>Event: {booking.tickets?.title}</span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Event Information</h4>
                <p className="text-gray-600 mb-1">
                  <strong>Venue:</strong> {booking.tickets?.venue_name}
                </p>
                <p className="text-gray-600 mb-1">
                  <strong>Address:</strong> {booking.tickets?.venue_address}
                </p>
                <p className="text-gray-600">
                  <strong>Date:</strong> {booking.tickets?.event_start_date ? formatDate(booking.tickets.event_start_date) : 'TBD'}
                </p>
              </div>
            </div>

            {/* Attendee List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendees</h3>
              
              {booking.attendee_details && booking.attendee_details.length > 0 ? (
                <div className="space-y-3">
                  {booking.attendee_details.map((attendee: any, index: number) => (
                    <div
                      key={attendee.id || index}
                      className={`border rounded-lg p-4 ${
                        attendee.checked_in ? 'border-green-200 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {attendee.first_name} {attendee.last_name}
                          </h4>
                          <p className="text-sm text-gray-600">{attendee.email}</p>
                          {attendee.checked_in && (
                            <div className="flex items-center mt-2">
                              <CheckCircle size={16} className="text-green-500 mr-1" />
                              <span className="text-sm text-green-600">
                                Checked in at {formatTime(attendee.check_in_time)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          {attendee.checked_in ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle size={20} className="mr-2" />
                              <span className="text-sm font-medium">Checked In</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCheckIn(attendee.id)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                            >
                              <CheckCircle size={16} className="mr-2" />
                              Check In
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No attendee details available</p>
              )}
            </div>

            {/* QR Code Display */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking QR Code</h3>
              <div className="flex justify-center">
                <div className="bg-gray-100 p-8 rounded-lg">
                  <QrCode size={128} className="text-gray-400" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Reference: {booking.booking_reference}
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use Check-In</h3>
          <ul className="text-blue-800 space-y-1">
            <li>1. Enter the booking reference number provided to the customer</li>
            <li>2. Review the booking details and attendee information</li>
            <li>3. Click "Check In" for each attendee as they arrive</li>
            <li>4. The system will automatically update the booking status</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

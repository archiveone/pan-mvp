'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import { Calendar, MapPin, QrCode, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface Ticket {
  id: string
  event_title: string
  event_date: string
  venue_name: string
  city: string
  event_image: string
  tier_name: string
  quantity: number
  qr_code: string
  checked_in: boolean
  status: string
  attendee_name: string
}

export default function MyTicketsPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')

  useEffect(() => {
    if (user) {
      loadTickets()
    }
  }, [user, filter])

  const loadTickets = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('my_tickets')
        .select('*')
        .eq('buyer_id', user?.id)

      if (filter === 'upcoming') {
        query = query.gte('event_date', new Date().toISOString())
      } else if (filter === 'past') {
        query = query.lt('event_date', new Date().toISOString())
      }

      const { data, error } = await query.order('event_date', { ascending: true })

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in to view your tickets</h1>
          <Link href="/" className="text-lime-600 hover:underline">Go to homepage</Link>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">My Tickets</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['upcoming', 'past', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-lime-500 text-black'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No tickets yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Browse events and get your first ticket!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-lime-500 text-black rounded-lg font-medium hover:bg-lime-400"
            >
              Explore Events
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="md:flex">
                  {/* Event Image */}
                  <div className="md:w-48 h-48 md:h-auto">
                    {ticket.event_image ? (
                      <img
                        src={ticket.event_image}
                        alt={ticket.event_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-4xl">
                        🎫
                      </div>
                    )}
                  </div>

                  {/* Ticket Details */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {ticket.event_title}
                        </h3>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar size={16} />
                            <span>{new Date(ticket.event_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MapPin size={16} />
                            <span>{ticket.venue_name}, {ticket.city}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div>
                        {ticket.checked_in ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            <CheckCircle size={14} />
                            Checked In
                          </span>
                        ) : new Date(ticket.event_date) > new Date() ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            <Clock size={14} />
                            Upcoming
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                            Past Event
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ticket Info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Type</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{ticket.tier_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Attendee: {ticket.attendee_name}
                        </p>
                      </div>
                      
                      {/* QR Code Button */}
                      {!ticket.checked_in && new Date(ticket.event_date) > new Date() && (
                        <button className="px-4 py-2 bg-lime-500 text-black rounded-lg hover:bg-lime-400 flex items-center gap-2 font-medium">
                          <QrCode size={18} />
                          Show QR Code
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  )
}


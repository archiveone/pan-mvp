'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import { Calendar, MapPin, Clock, Users, Globe, Heart, Share2, Ticket, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isInterested, setIsInterested] = useState(false)

  useEffect(() => {
    if (params?.id) {
      loadEvent()
    }
  }, [params?.id])

  const loadEvent = async () => {
    if (!params?.id) return
    
    try {
      const { data, error } = await supabase
        .from('advanced_events')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      setEvent(data)

      // Check if user is interested
      if (user) {
        const { data: interestedData } = await supabase
          .from('event_interested')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', params.id)
          .single()
        
        setIsInterested(!!interestedData)
      }
    } catch (error) {
      console.error('Error loading event:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleInterested = async () => {
    if (!user || !params?.id) {
      router.push('/login')
      return
    }

    try {
      if (isInterested) {
        await supabase
          .from('event_interested')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', params.id)
      } else {
        await supabase
          .from('event_interested')
          .insert({
            user_id: user.id,
            event_id: params.id
          })
      }
      setIsInterested(!isInterested)
    } catch (error) {
      console.error('Error toggling interest:', error)
    }
  }

  const getTicketRange = () => {
    if (!event?.ticket_tiers || event.ticket_tiers.length === 0) return null
    const prices = event.ticket_tiers.map((t: any) => t.price).sort((a: number, b: number) => a - b)
    if (prices[0] === 0) return 'Free'
    if (prices[0] === prices[prices.length - 1]) return `$${prices[0]}`
    return `$${prices[0]} - $${prices[prices.length - 1]}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Event not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8 pb-24">
        {/* Cover Image */}
        <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-8">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Calendar className="w-24 h-24 text-white opacity-50" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Category */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  {event.category}
                </span>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                  {event.event_type}
                </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {event.title}
              </h1>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <span>{event.attendee_count} attending</span>
                <span>•</span>
                <span>{event.interested_count} interested</span>
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-gray-700 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(event.start_date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(event.start_date).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - {new Date(event.end_date).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {event.timezone}
                  </p>
                </div>
              </div>

              {event.event_type !== 'virtual' && event.venue_name && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white dark:bg-gray-700 rounded-xl">
                    <MapPin className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{event.venue_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {event.address}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {event.city}, {event.state} {event.postal_code}
                    </p>
                  </div>
                </div>
              )}

              {(event.event_type === 'virtual' || event.event_type === 'hybrid') && event.virtual_link && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white dark:bg-gray-700 rounded-xl">
                    <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Virtual Event</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Link will be provided after registration
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">About this event</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Organizer */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Organizer</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  {event.profiles?.avatar_url ? (
                    <img src={event.profiles.avatar_url} alt={event.profiles.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      👤
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {event.profiles?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{event.profiles?.username || 'user'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Tickets */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              {/* Price */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Starting at</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {getTicketRange()}
                </p>
              </div>

              {/* Capacity */}
              {event.total_capacity && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Spots remaining</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {event.remaining_capacity || event.total_capacity}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => params?.id && router.push(`/event/${params.id}/book`)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Ticket className="w-5 h-5" />
                  Get Tickets
                </button>

                <button
                  onClick={toggleInterested}
                  className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    isInterested
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Heart className="w-5 h-5" fill={isInterested ? 'currentColor' : 'none'} />
                  {isInterested ? 'Interested' : 'Mark as Interested'}
                </button>

                <button className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors flex items-center justify-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Share Event
                </button>
              </div>

              {/* Additional Info */}
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 pt-6 border-t border-gray-200 dark:border-gray-700">
                {event.age_restriction && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Age:</span>
                    <span>{event.age_restriction}+</span>
                  </div>
                )}
                {event.dress_code && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Dress code:</span>
                    <span>{event.dress_code}</span>
                  </div>
                )}
                {event.refund_policy && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Refunds:</span>
                    <span>{event.refund_policy}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        {event.gallery_images && event.gallery_images.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Event Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {event.gallery_images.map((img: string, idx: number) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden">
                  <img src={img} alt={`Event ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  )
}


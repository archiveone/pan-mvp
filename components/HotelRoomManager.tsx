'use client'

import { useState } from 'react'
import { Plus, Edit3, Copy, Trash2, Bed, Users, Eye, Calendar, DollarSign } from 'lucide-react'

interface Room {
  id: string
  name: string
  roomType: string
  bedType: string
  maxOccupancy: number
  floor: number
  view?: string
  price: number
  quantity: number
  images: string[]
  amenities: string[]
  isActive: boolean
  bookedNights: number
  revenue: number
}

interface HotelRoomManagerProps {
  listingId: string
  rooms: Room[]
  onAddRoom: (room: Partial<Room>) => void
  onUpdateRoom: (roomId: string, updates: Partial<Room>) => void
  onDeleteRoom: (roomId: string) => void
  onDuplicateRoom: (roomId: string) => void
}

export function HotelRoomManager({
  listingId,
  rooms,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onDuplicateRoom
}: HotelRoomManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState<string | null>(null)

  const roomTypes = ['Single', 'Double', 'Twin', 'Suite', 'Dormitory', 'Penthouse']
  const bedTypes = ['Single Bed', 'Double Bed', 'Queen Bed', 'King Bed', 'Bunk Beds']
  const viewOptions = ['City View', 'Ocean View', 'Mountain View', 'Garden View', 'No View']

  const getRoomIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'suite':
      case 'penthouse':
        return '👑'
      case 'dormitory':
        return '🛏️'
      default:
        return '🏨'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Room Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {rooms.length} room types • Total {rooms.reduce((sum, r) => sum + r.quantity, 0)} rooms
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Room Type
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Rooms</span>
            <Bed className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {rooms.reduce((sum, r) => sum + r.quantity, 0)}
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${rooms.reduce((sum, r) => sum + r.revenue, 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Avg Price</span>
            <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${rooms.length > 0 ? Math.round(rooms.reduce((sum, r) => sum + r.price, 0) / rooms.length) : 0}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Bookings</span>
            <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {rooms.reduce((sum, r) => sum + r.bookedNights, 0)}
          </p>
        </div>
      </div>

      {/* Rooms List */}
      <div className="space-y-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{getRoomIcon(room.roomType)}</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {room.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                      {room.roomType}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                      {room.bedType}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {room.maxOccupancy}
                    </span>
                    {room.view && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {room.view}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingRoom(room.id)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => onDuplicateRoom(room.id)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => onDeleteRoom(room.id)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>

            {/* Room Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Price/Night</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">${room.price}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Available</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{room.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Booked Nights</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{room.bookedNights}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">${room.revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HotelRoomManager


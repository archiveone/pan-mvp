'use client'

import { useState } from 'react'
import { Plus, Edit3, Copy, Trash2, Car, Calendar, DollarSign, Fuel, Users as Seats } from 'lucide-react'

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
  transmission: 'automatic' | 'manual' | 'electric'
  fuelType: string
  seats: number
  color: string
  licensePlate?: string
  price: number
  mileage?: number
  images: string[]
  isAvailable: boolean
  bookingCount: number
  revenue: number
}

interface VehicleFleetManagerProps {
  listingId: string
  vehicles: Vehicle[]
  onAddVehicle: (vehicle: Partial<Vehicle>) => void
  onUpdateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => void
  onDeleteVehicle: (vehicleId: string) => void
  onDuplicateVehicle: (vehicleId: string) => void
}

export function VehicleFleetManager({
  vehicles,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onDuplicateVehicle
}: VehicleFleetManagerProps) {
  const getVehicleIcon = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('suv') || t.includes('truck')) return '🚙'
    if (t.includes('electric') || t.includes('tesla')) return '⚡'
    if (t.includes('luxury') || t.includes('premium')) return '✨'
    return '🚗'
  }

  const getTransmissionBadge = (transmission: string) => {
    switch (transmission) {
      case 'automatic': return '🔄 Auto'
      case 'manual': return '⚙️ Manual'
      case 'electric': return '⚡ Electric'
      default: return transmission
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fleet Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {vehicles.length} vehicles in your fleet
          </p>
        </div>
        <button
          onClick={() => onAddVehicle({})}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Vehicle
        </button>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Vehicles</span>
            <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{vehicles.length}</p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Available Now</span>
            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {vehicles.filter(v => v.isAvailable).length}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</span>
            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {vehicles.reduce((sum, v) => sum + v.bookingCount, 0)}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${vehicles.reduce((sum, v) => sum + v.revenue, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all"
          >
            {/* Vehicle Image */}
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
              {vehicle.images[0] ? (
                <img
                  src={vehicle.images[0]}
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  {getVehicleIcon(vehicle.make)}
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  vehicle.isAvailable
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {vehicle.isAvailable ? 'Available' : 'Booked'}
                </span>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="p-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                  {getTransmissionBadge(vehicle.transmission)}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center gap-1">
                  <Seats className="w-3 h-3" />
                  {vehicle.seats} seats
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center gap-1">
                  <Fuel className="w-3 h-3" />
                  {vehicle.fuelType}
                </span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Price/Day</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">${vehicle.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    ${vehicle.revenue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingRoom(vehicle.id)}
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDuplicateVehicle(vehicle.id)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteVehicle(vehicle.id)}
                  className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Vehicle Card */}
        <button
          onClick={() => onAddVehicle({})}
          className="h-full min-h-[300px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex flex-col items-center justify-center gap-3"
        >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Plus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="font-medium text-gray-700 dark:text-gray-300">Add Vehicle</p>
        </button>
      </div>
    </div>
  )
}

export default VehicleFleetManager


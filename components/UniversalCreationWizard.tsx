'use client'

import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Plus, Trash2, Copy, Image as ImageIcon, Video, Music, FileText, Calendar, Home, Car, Package, Briefcase, Sparkles } from 'lucide-react'

interface CreationWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: any) => void
}

export function UniversalCreationWizard({ isOpen, onClose, onComplete }: CreationWizardProps) {
  const [step, setStep] = useState(1)
  const [contentType, setContentType] = useState<string | null>(null)
  const [hasMultipleItems, setHasMultipleItems] = useState(false)
  
  // Basic info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  
  // Business info
  const [businessName, setBusinessName] = useState('')
  const [location, setLocation] = useState({ city: '', state: '', country: '' })
  
  // Multi-item (variants)
  const [variants, setVariants] = useState<any[]>([])
  
  // Media
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [gallery, setGallery] = useState<string[]>([])

  const contentTypes = [
    {
      id: 'post',
      name: 'Social Post',
      icon: Sparkles,
      color: 'from-blue-500 to-cyan-500',
      description: 'Share photos, thoughts, updates',
      supportsMultiple: false,
      isBusiness: false
    },
    {
      id: 'product',
      name: 'Product',
      icon: Package,
      color: 'from-green-500 to-emerald-500',
      description: 'Sell physical or digital products',
      supportsMultiple: true,
      multipleLabel: 'Variants (sizes, colors, etc.)',
      isBusiness: true
    },
    {
      id: 'hotel',
      name: 'Hotel/Hostel',
      icon: Home,
      color: 'from-purple-500 to-pink-500',
      description: 'Multiple rooms for booking',
      supportsMultiple: true,
      multipleLabel: 'Rooms',
      isBusiness: true
    },
    {
      id: 'vehicle_rental',
      name: 'Vehicle Rental',
      icon: Car,
      color: 'from-orange-500 to-red-500',
      description: 'Cars, bikes, boats for rent',
      supportsMultiple: true,
      multipleLabel: 'Vehicles in fleet',
      isBusiness: true
    },
    {
      id: 'equipment_rental',
      name: 'Equipment Rental',
      icon: Briefcase,
      color: 'from-yellow-500 to-orange-500',
      description: 'Tools, cameras, equipment',
      supportsMultiple: true,
      multipleLabel: 'Items available',
      isBusiness: true
    },
    {
      id: 'event',
      name: 'Event',
      icon: Calendar,
      color: 'from-indigo-500 to-purple-500',
      description: 'Ticketed events & experiences',
      supportsMultiple: true,
      multipleLabel: 'Ticket tiers',
      isBusiness: true
    },
    {
      id: 'music',
      name: 'Music',
      icon: Music,
      color: 'from-pink-500 to-rose-500',
      description: 'Share or sell music tracks',
      supportsMultiple: true,
      multipleLabel: 'Tracks in album',
      isBusiness: false
    },
    {
      id: 'video',
      name: 'Video',
      icon: Video,
      color: 'from-red-500 to-pink-500',
      description: 'Share or sell video content',
      supportsMultiple: false,
      isBusiness: false
    },
    {
      id: 'document',
      name: 'Document',
      icon: FileText,
      color: 'from-slate-500 to-gray-500',
      description: 'PDFs, docs, spreadsheets',
      supportsMultiple: false,
      isBusiness: false
    }
  ]

  const selectedType = contentTypes.find(t => t.id === contentType)

  const addVariant = () => {
    const newVariant: any = {
      id: `temp_${Date.now()}`,
      name: '',
      description: '',
      price: 0,
      quantity: 1,
      images: [],
      attributes: {}
    }

    // Add type-specific defaults
    if (contentType === 'hotel') {
      newVariant.attributes = {
        roomType: '',
        bedType: '',
        maxOccupancy: 2,
        floor: 1,
        view: ''
      }
    } else if (contentType === 'vehicle_rental') {
      newVariant.attributes = {
        make: '',
        model: '',
        year: new Date().getFullYear(),
        transmission: 'automatic',
        fuelType: 'gasoline',
        seats: 5
      }
    } else if (contentType === 'product') {
      newVariant.attributes = {
        size: '',
        color: '',
        material: ''
      }
    } else if (contentType === 'event') {
      newVariant.attributes = {
        tierName: '',
        perks: []
      }
    }

    setVariants([...variants, newVariant])
  }

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...variants]
    if (field.startsWith('attributes.')) {
      const attrField = field.split('.')[1]
      updated[index].attributes[attrField] = value
    } else {
      updated[index][field] = value
    }
    setVariants(updated)
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const duplicateVariant = (index: number) => {
    const clone = { ...variants[index], id: `temp_${Date.now()}`, name: `${variants[index].name} (Copy)` }
    setVariants([...variants, clone])
  }

  const handleComplete = () => {
    const data = {
      contentType,
      hasVariants: hasMultipleItems,
      basicInfo: { title, description, category, businessName },
      location,
      media: { coverImage, gallery },
      variants: hasMultipleItems ? variants : []
    }
    onComplete(data)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {step === 1 ? 'What do you want to create?' : 
                 step === 2 ? 'Tell us about it' : 
                 step === 3 && hasMultipleItems ? `Add ${selectedType?.multipleLabel || 'Items'}` :
                 'Add media'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Step {step} of {hasMultipleItems ? 4 : 3}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* STEP 1: Select Content Type */}
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setContentType(type.id)
                        setHasMultipleItems(false)
                        setStep(2)
                      }}
                      className="group relative p-6 text-left rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-all hover:shadow-lg"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                        {type.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {type.description}
                      </p>
                      {type.isBusiness && (
                        <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                          Business
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* STEP 2: Basic Information */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      contentType === 'hotel' ? 'Luxury Downtown Hotel' :
                      contentType === 'vehicle_rental' ? 'Premium Car Rentals' :
                      contentType === 'product' ? 'Vintage Leather Jacket' :
                      'Give it a catchy title'
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you're offering..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {selectedType?.isBusiness && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Your business name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={location.city}
                      onChange={(e) => setLocation({ ...location, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={location.state}
                      onChange={(e) => setLocation({ ...location, state: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      value={location.country}
                      onChange={(e) => setLocation({ ...location, country: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Multiple Items Toggle */}
                {selectedType?.supportsMultiple && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Do you have multiple {selectedType.multipleLabel?.toLowerCase()}?
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {contentType === 'hotel' && 'Perfect for hotels with multiple room types'}
                          {contentType === 'vehicle_rental' && 'Ideal for rental businesses with a fleet'}
                          {contentType === 'product' && 'Great for products with sizes, colors, or variants'}
                          {contentType === 'equipment_rental' && 'Perfect for multiple items or quantities'}
                        </p>
                      </div>
                      <button
                        onClick={() => setHasMultipleItems(!hasMultipleItems)}
                        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          hasMultipleItems ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            hasMultipleItems ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Add Variants (if applicable) */}
            {step === 3 && hasMultipleItems && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedType?.multipleLabel || 'Items'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add each {contentType === 'hotel' ? 'room type' : 
                                contentType === 'vehicle_rental' ? 'vehicle' :
                                contentType === 'product' ? 'variant' : 'item'}
                    </p>
                  </div>
                  <button
                    onClick={addVariant}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add {contentType === 'hotel' ? 'Room' : 
                         contentType === 'vehicle_rental' ? 'Vehicle' :
                         contentType === 'product' ? 'Variant' : 'Item'}
                  </button>
                </div>

                <div className="space-y-4">
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {contentType === 'hotel' ? `Room ${index + 1}` : 
                           contentType === 'vehicle_rental' ? `Vehicle ${index + 1}` :
                           contentType === 'product' ? `Variant ${index + 1}` :
                           `Item ${index + 1}`}
                        </h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => duplicateVariant(index)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => removeVariant(index)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={variant.name}
                            onChange={(e) => updateVariant(index, 'name', e.target.value)}
                            placeholder={
                              contentType === 'hotel' ? 'Deluxe Suite' :
                              contentType === 'vehicle_rental' ? 'Tesla Model 3' :
                              'Variant name'
                            }
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Price *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="number"
                              value={variant.price}
                              onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))}
                              className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                              /{contentType === 'hotel' ? 'night' : contentType?.includes('rental') ? 'day' : 'unit'}
                            </span>
                          </div>
                        </div>

                        {/* Type-specific fields */}
                        {contentType === 'hotel' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Room Type
                              </label>
                              <select
                                value={variant.attributes.roomType}
                                onChange={(e) => updateVariant(index, 'attributes.roomType', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="">Select...</option>
                                <option value="single">Single Room</option>
                                <option value="double">Double Room</option>
                                <option value="twin">Twin Room</option>
                                <option value="suite">Suite</option>
                                <option value="dormitory">Dormitory</option>
                                <option value="penthouse">Penthouse</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Max Occupancy
                              </label>
                              <input
                                type="number"
                                value={variant.attributes.maxOccupancy}
                                onChange={(e) => updateVariant(index, 'attributes.maxOccupancy', parseInt(e.target.value))}
                                min="1"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Bed Type
                              </label>
                              <select
                                value={variant.attributes.bedType}
                                onChange={(e) => updateVariant(index, 'attributes.bedType', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="">Select...</option>
                                <option value="single">Single Bed</option>
                                <option value="double">Double Bed</option>
                                <option value="queen">Queen Bed</option>
                                <option value="king">King Bed</option>
                                <option value="bunk">Bunk Beds</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Floor
                              </label>
                              <input
                                type="number"
                                value={variant.attributes.floor}
                                onChange={(e) => updateVariant(index, 'attributes.floor', parseInt(e.target.value))}
                                min="0"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          </>
                        )}

                        {contentType === 'vehicle_rental' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Make
                              </label>
                              <input
                                type="text"
                                value={variant.attributes.make}
                                onChange={(e) => updateVariant(index, 'attributes.make', e.target.value)}
                                placeholder="Tesla, Toyota, Ford..."
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Model
                              </label>
                              <input
                                type="text"
                                value={variant.attributes.model}
                                onChange={(e) => updateVariant(index, 'attributes.model', e.target.value)}
                                placeholder="Model 3, Camry, F-150..."
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Year
                              </label>
                              <input
                                type="number"
                                value={variant.attributes.year}
                                onChange={(e) => updateVariant(index, 'attributes.year', parseInt(e.target.value))}
                                min="1900"
                                max={new Date().getFullYear() + 1}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Transmission
                              </label>
                              <select
                                value={variant.attributes.transmission}
                                onChange={(e) => updateVariant(index, 'attributes.transmission', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="automatic">Automatic</option>
                                <option value="manual">Manual</option>
                                <option value="electric">Electric</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Seats
                              </label>
                              <input
                                type="number"
                                value={variant.attributes.seats}
                                onChange={(e) => updateVariant(index, 'attributes.seats', parseInt(e.target.value))}
                                min="1"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fuel Type
                              </label>
                              <select
                                value={variant.attributes.fuelType}
                                onChange={(e) => updateVariant(index, 'attributes.fuelType', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="gasoline">Gasoline</option>
                                <option value="diesel">Diesel</option>
                                <option value="electric">Electric</option>
                                <option value="hybrid">Hybrid</option>
                              </select>
                            </div>
                          </>
                        )}

                        {contentType === 'product' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Size
                              </label>
                              <input
                                type="text"
                                value={variant.attributes.size}
                                onChange={(e) => updateVariant(index, 'attributes.size', e.target.value)}
                                placeholder="S, M, L, XL"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Color
                              </label>
                              <input
                                type="text"
                                value={variant.attributes.color}
                                onChange={(e) => updateVariant(index, 'attributes.color', e.target.value)}
                                placeholder="Black, White, Red..."
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Quantity Available
                          </label>
                          <input
                            type="number"
                            value={variant.quantity}
                            onChange={(e) => updateVariant(index, 'quantity', parseInt(e.target.value))}
                            min="1"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={variant.description}
                          onChange={(e) => updateVariant(index, 'description', e.target.value)}
                          rows={2}
                          placeholder="Specific details about this item..."
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                        />
                      </div>
                    </div>
                  ))}

                  {variants.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        No {selectedType?.multipleLabel?.toLowerCase()} added yet
                      </p>
                      <button
                        onClick={addVariant}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium inline-flex items-center gap-2 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        Add Your First {contentType === 'hotel' ? 'Room' : 
                                      contentType === 'vehicle_rental' ? 'Vehicle' : 'Item'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4 (or 3): Media Upload */}
            {((step === 3 && !hasMultipleItems) || (step === 4 && hasMultipleItems)) && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Cover Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
                    {coverImage ? (
                      <div className="relative">
                        <img src={coverImage} alt="Cover" className="max-h-64 mx-auto rounded-lg" />
                        <button
                          onClick={() => setCoverImage(null)}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-400">Click to upload cover image</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Gallery Images (Optional)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {gallery.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setGallery(gallery.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 flex items-center justify-center transition-colors">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors flex items-center gap-2"
              disabled={step === 1}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            <div className="flex gap-2">
              {Array.from({ length: hasMultipleItems ? 4 : 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i + 1 === step ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                if ((step === 3 && !hasMultipleItems) || (step === 4 && hasMultipleItems)) {
                  handleComplete()
                } else {
                  setStep(step + 1)
                }
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {((step === 3 && !hasMultipleItems) || (step === 4 && hasMultipleItems)) ? 'Create' : 'Next'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UniversalCreationWizard


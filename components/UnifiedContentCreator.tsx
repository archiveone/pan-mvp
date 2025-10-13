'use client'

import React, { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ContentService } from '@/services/contentService'
import { PaymentService } from '@/services/paymentService'
import { BookingService } from '@/services/bookingService'
import { TransactionCategory, TransactionSubtype } from '@/types/transactions'
import { Plus, Upload, X, Music, Video, FileText, Image, Calendar, CreditCard, Users, Home, Heart, Gift, Clock, MapPin, Star, Settings } from 'lucide-react'
import ImageCropper from './ImageCropper'

interface UnifiedContentCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (contentId: string) => void
}

type PostType = 'free' | 'marketplace'

export default function UnifiedContentCreator({ isOpen, onClose, onSuccess }: UnifiedContentCreatorProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Media Upload (4 images max)
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null)
  const [additionalMedia, setAdditionalMedia] = useState<File[]>([])
  
  // Image cropping state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [cropImageType, setCropImageType] = useState<'main' | 'additional' | null>(null)
  const [tempImageFile, setTempImageFile] = useState<File | null>(null)
  
  // Additional media types
  const [audioFiles, setAudioFiles] = useState<File[]>([])
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const [documentFiles, setDocumentFiles] = useState<File[]>([])
  
  // Location autocomplete
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)

  // Step 2: Basic Content
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Step 3: Post Type
  const [postType, setPostType] = useState<PostType>('free')

  // Step 4: Marketplace Setup
  const [transactionCategory, setTransactionCategory] = useState<TransactionCategory>('purchases_ecommerce')
  const [transactionSubtype, setTransactionSubtype] = useState<TransactionSubtype>('physical_product')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('EUR')

  // Multiple pricing options for different categories
  const [pricingOptions, setPricingOptions] = useState<Array<{
    id: string
    name: string
    price: number
    description?: string
    features?: string[]
    isPopular?: boolean
    availability?: number // For events/rooms
    maxQuantity?: number
  }>>([])

  // Add new pricing option
  const [newPricingName, setNewPricingName] = useState('')
  const [newPricingPrice, setNewPricingPrice] = useState('')
  const [newPricingDescription, setNewPricingDescription] = useState('')
  const [newPricingAvailability, setNewPricingAvailability] = useState('')

  // Booking/Event specific fields
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [venue, setVenue] = useState('')
  const [capacity, setCapacity] = useState('')
  const [bookingDuration, setBookingDuration] = useState('')
  const [maxPartySize, setMaxPartySize] = useState('')
  const [rentalPeriod, setRentalPeriod] = useState('')
  const [securityDeposit, setSecurityDeposit] = useState('')

  // Availability settings for bookings
  const [availability, setAvailability] = useState<Array<{
    id: string
    day: string
    startTime: string
    endTime: string
    slots: number
    price?: number
  }>>([])

  const resetForm = useCallback(() => {
    setStep(1)
    setIsLoading(false)
    setError(null)
    setMainImage(null)
    setMainImagePreview(null)
    setAdditionalMedia([])
    setCropImageSrc(null)
    setCropImageType(null)
    setTempImageFile(null)
    setAudioFiles([])
    setVideoFiles([])
    setDocumentFiles([])
    setTitle('')
    setDescription('')
    setTags([])
    setTagInput('')
    setPostType('free')
    setTransactionCategory('purchases_ecommerce')
    setTransactionSubtype('physical_product')
    setPrice('')
    setCurrency('EUR')
    setPricingOptions([])
    setNewPricingName('')
    setNewPricingPrice('')
    setNewPricingDescription('')
    setNewPricingAvailability('')
    setEventDate('')
    setEventTime('')
    setVenue('')
    setCapacity('')
    setBookingDuration('')
    setMaxPartySize('')
    setRentalPeriod('')
    setSecurityDeposit('')
    setAvailability([])
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const handleMainImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    console.log('📸 Main image upload triggered, files:', files.length)
    if (files.length > 0) {
      const firstFile = files[0]
      console.log('📸 First file:', firstFile.name, firstFile.type)
      setTempImageFile(firstFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        console.log('📸 Image loaded, opening cropper')
        setCropImageSrc(e.target?.result as string)
        setCropImageType('main')
      }
      reader.readAsDataURL(firstFile)
    }
  }, [])
  
  const handleCropComplete = useCallback((croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], tempImageFile?.name || 'cropped.jpg', {
      type: 'image/jpeg'
    })
    
    if (cropImageType === 'main') {
      setMainImage(croppedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setMainImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(croppedFile)
    } else if (cropImageType === 'additional') {
      setAdditionalMedia(prev => [...prev, croppedFile])
    }
    
    // Reset crop state
    setCropImageSrc(null)
    setCropImageType(null)
    setTempImageFile(null)
  }, [cropImageType, tempImageFile])
  
  const handleCropCancel = useCallback(() => {
    setCropImageSrc(null)
    setCropImageType(null)
    setTempImageFile(null)
  }, [])

  const handleAdditionalMediaUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const currentCount = additionalMedia.length
    const availableSlots = 4 - currentCount
    
    if (files.length > 0 && availableSlots > 0) {
      const firstFile = files[0]
      setTempImageFile(firstFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setCropImageSrc(e.target?.result as string)
        setCropImageType('additional')
      }
      reader.readAsDataURL(firstFile)
      
      if (files.length > 1) {
        setError(`Please crop one image at a time. ${files.length - 1} files were ignored.`)
      }
    }
  }, [additionalMedia.length])

  const removeAdditionalMedia = useCallback((index: number) => {
    setAdditionalMedia(prev => prev.filter((_, i) => i !== index))
  }, [])

  const addTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()])
      setTagInput('')
    }
  }, [tagInput, tags])

  const removeTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }, [])

  const addPricingOption = useCallback(() => {
    if (newPricingName.trim() && newPricingPrice.trim()) {
      const newOption = {
        id: Date.now().toString(),
        name: newPricingName.trim(),
        price: parseFloat(newPricingPrice),
        description: newPricingDescription.trim() || undefined,
        availability: newPricingAvailability ? parseInt(newPricingAvailability) : undefined,
        features: [],
        isPopular: pricingOptions.length === 0
      }
      setPricingOptions(prev => [...prev, newOption])
      setNewPricingName('')
      setNewPricingPrice('')
      setNewPricingDescription('')
      setNewPricingAvailability('')
    }
  }, [newPricingName, newPricingPrice, newPricingDescription, newPricingAvailability, pricingOptions.length])

  const removePricingOption = useCallback((id: string) => {
    setPricingOptions(prev => prev.filter(option => option.id !== id))
  }, [])

  const togglePopular = useCallback((id: string) => {
    setPricingOptions(prev => prev.map(option => ({
      ...option,
      isPopular: option.id === id ? !option.isPopular : false
    })))
  }, [])

  const getTransactionSubtypes = useCallback((category: TransactionCategory): TransactionSubtype[] => {
    const subtypeMap: Record<TransactionCategory, TransactionSubtype[]> = {
      'ticketing_attendance': ['event_ticket', 'guestlist_rsvp', 'early_bird_tiered', 'vip_access_pass', 'season_pass'],
      'bookings_reservations': ['appointment_booking', 'table_reservation', 'stay_accommodation', 'studio_venue_booking', 'session_class_booking'],
      'purchases_ecommerce': ['physical_product', 'digital_product_download', 'pre_order', 'custom_made_order', 'bundle_pack'],
      'digital_access_media': ['streaming_access', 'video_course_tutorial', 'music_audio_stream', 'download_access'],
      'video_series': ['video_series_episode', 'documentary_series', 'tutorial_series', 'webinar_series', 'live_stream_series'],
      'music_album': ['single_track', 'album_collection', 'ep_mini_album', 'live_performance_recording', 'instrumental_tracks'],
      'documents_software': ['ebook_document', 'software_application', 'mobile_app', 'plugin_extension', 'template_collection'],
      'donations_crowdfunding': ['one_time_donation', 'recurring_donation', 'pay_what_you_want', 'crowdfunding_goal_based'],
      'memberships_subscriptions': ['monthly_subscription', 'annual_subscription', 'lifetime_access', 'premium_membership'],
      'rentals_leases': ['equipment_rental', 'vehicle_rental', 'property_rental', 'space_rental', 'tool_rental'],
      'free_trial_rsvp': ['free_trial', 'rsvp_event', 'free_download', 'free_access', 'free_consultation']
    }
    
    return subtypeMap[category] || []
  }, [])

  const handleNext = useCallback(() => {
    console.log('📍 Current step:', step, 'Post type:', postType)
    
    if (step < 4) {
      setStep(prev => prev + 1)
      console.log('➡️ Moving to next step:', step + 1)
    }
  }, [step, postType])

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(prev => prev - 1)
    }
  }, [step])

  const handleSubmit = useCallback(async () => {
    console.log('🚀 Starting upload process...')
    console.log('📍 Location value:', venue)
    
    if (!mainImage || !title.trim()) {
      setError('Please add at least one image and a title')
      console.error('❌ Validation failed: Missing image or title')
      return
    }
    
    // Validate marketplace posts have a price
    if (postType === 'marketplace' && !price && pricingOptions.length === 0) {
      setError('Please set a price for your marketplace listing')
      console.error('❌ Validation failed: Marketplace post needs a price')
      return
    }
    
    // Ensure description is not empty - use fallback if blank
    const finalDescription = (description && description.trim()) ? description.trim() : 'No description provided'
    console.log('📝 Using description:', finalDescription)
    console.log('📋 Post type:', postType, 'Price:', price)
    
    // Check if already loading to prevent double submit
    if (isLoading) {
      console.warn('⚠️ Already uploading, ignoring duplicate call')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Import ImageService for uploads
      const { ImageService } = await import('@/services/imageService')
      
      console.log('📤 Uploading images to Supabase Storage...')
      console.log('Total images to upload:', [mainImage, ...additionalMedia].length)
      
      // Upload images to Supabase Storage FIRST with timeout
      const allImages = [mainImage, ...additionalMedia]
      
      const uploadPromise = ImageService.uploadImages(allImages, 'content-images', 'posts')
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout after 30 seconds. Check your internet connection or try smaller images.')), 30000)
      )
      
      const uploadResult = await Promise.race([uploadPromise, timeoutPromise]) as any
      
      console.log('Upload result:', uploadResult)
      
      if (!uploadResult.success) {
        const errorMsg = uploadResult.error || 'Failed to upload images to storage'
        console.error('❌ Image upload failed:', errorMsg)
        
        // Check if it's a bucket error
        if (errorMsg.includes('bucket') || errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
          throw new Error('⚠️ Storage buckets missing! Go to Supabase Dashboard → Storage → Create buckets "content-images" and "media" (make them PUBLIC). See CREATE-STORAGE-BUCKETS-NOW.md for details.')
        }
        
        throw new Error(errorMsg)
      }
      
      if (!uploadResult.urls || uploadResult.urls.length === 0) {
        throw new Error('Upload succeeded but no URLs returned')
      }

      console.log('✅ Images uploaded successfully:', uploadResult.urls)

      // Upload audio files if any
      let audioUrls: string[] = []
      if (audioFiles.length > 0) {
        console.log('📤 Uploading audio files...')
        for (const audioFile of audioFiles) {
          const audioResult = await ImageService.uploadImage(audioFile, 'media', 'audio')
          if (audioResult.success && audioResult.url) {
            audioUrls.push(audioResult.url)
          }
        }
        console.log('✅ Audio files uploaded:', audioUrls.length)
      }

      // Upload video files if any
      let videoUrls: string[] = []
      if (videoFiles.length > 0) {
        console.log('📤 Uploading video files...')
        for (const videoFile of videoFiles) {
          const videoResult = await ImageService.uploadImage(videoFile, 'media', 'videos')
          if (videoResult.success && videoResult.url) {
            videoUrls.push(videoResult.url)
          }
        }
        console.log('✅ Video files uploaded:', videoUrls.length)
      }

      // Upload document files if any
      let documentUrls: string[] = []
      if (documentFiles.length > 0) {
        console.log('📤 Uploading document files...')
        for (const documentFile of documentFiles) {
          const documentResult = await ImageService.uploadImage(documentFile, 'media', 'documents')
          if (documentResult.success && documentResult.url) {
            documentUrls.push(documentResult.url)
          }
        }
        console.log('✅ Document files uploaded:', documentUrls.length)
      }

      // Check we have user
      if (!user) {
        throw new Error('You must be logged in to upload content')
      }

      // Now create content with the uploaded URLs
      const contentData = {
        user_id: user.id,
        title: title.trim(),
        content: finalDescription, // Ensure not empty
        description: finalDescription,
        tags,
        media_url: uploadResult.urls[0], // Main image URL
        media_urls: uploadResult.urls, // All image URLs
        audio_url: audioUrls[0],
        audio_urls: audioUrls,
        video_url: videoUrls[0],
        video_urls: videoUrls,
        document_urls: documentUrls,
        content_type: postType === 'marketplace' ? 'listing' : 'post',
        category: transactionSubtype || 'general',
        location: venue || undefined, // Save to location column only
        // Use pricing options if they exist, otherwise use single price
        price_amount: pricingOptions.length > 0 ? pricingOptions[0].price : 
                     (postType === 'marketplace' && price ? parseFloat(price) : undefined),
        currency: postType === 'marketplace' ? currency : undefined,
        event_date: eventDate || undefined,
        event_time: eventTime || undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
        is_published: true,
        is_safety_approved: true, // Auto-approve for now
        moderation_status: 'approved' as const
      }
      
      console.log('📋 Post type:', postType)
      console.log('💰 Price amount:', contentData.price_amount)
      console.log('📦 Content type:', contentData.content_type)

      console.log('💾 Saving to database...')
      console.log('Content data:', contentData)
      
      const result = await ContentService.createContent(contentData)
      
      console.log('Database result:', result)
      
      if (result.success && result.contentId) {
        console.log('✅ Content created successfully!', result.contentId)
        setIsLoading(false) // Stop loading first
        onSuccess?.(result.contentId)
        setTimeout(() => handleClose(), 100) // Small delay before closing
      } else {
        const errorMsg = result.error || 'Failed to create content'
        console.error('❌ Database save failed:', errorMsg)
        setIsLoading(false)
        throw new Error(errorMsg)
      }
    } catch (err) {
      console.error('❌ Upload failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      setIsLoading(false)
      
      // Show alert only if not already shown by error state
      if (!error) {
        alert('Upload failed: ' + errorMessage)
      }
    }
  }, [mainImage, title, description, tags, additionalMedia, audioFiles, videoFiles, documentFiles, postType, transactionCategory, transactionSubtype, price, currency, pricingOptions, eventDate, eventTime, venue, capacity, bookingDuration, maxPartySize, rentalPeriod, securityDeposit, user, error, onSuccess, handleClose])

  if (!isOpen) return null

  return (
    <>
      {/* Image Cropper Modal */}
      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
      
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full max-h-[85vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-lime-400 to-lime-300 p-3 flex items-center justify-end">
          <button
            onClick={handleClose}
            className="w-6 h-6 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gradient-to-r from-gray-50 to-yellow-50 dark:from-gray-800 dark:to-gray-700 p-2">
          <div className="bg-gradient-to-r from-lime-400 to-lime-300 h-2 rounded-full transition-all duration-300" 
               style={{ width: `${(step / 4) * 100}%` }} />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Step {step} of 4</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{Math.round((step / 4) * 100)}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 overflow-y-auto flex-1" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          
          {/* Step 1: Media Upload */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Main Photo Upload */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Main Photo *
                </label>
                {mainImage === null ? (
                  <div className="border-2 border-dashed border-blue-200 dark:border-blue-700 rounded-lg p-3 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageUpload}
                      className="hidden"
                      id="main-image-upload"
                    />
                    <label htmlFor="main-image-upload" className="cursor-pointer relative z-10">
                      <div className="space-y-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mx-auto group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300 shadow-md">
                          <Image size={16} className="text-blue-500 group-hover:text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-700 dark:text-gray-200 font-medium text-sm group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Add Main Photo</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your primary image</p>
                        </div>
                        <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg text-sm font-medium hover:brightness-95 transition-all duration-200 shadow-md hover:shadow-lg">
                          Choose Photo
                        </div>
                      </div>
                    </label>
                  </div>
                ) : mainImagePreview ? (
                  <div className="relative group">
                    <img
                      src={mainImagePreview}
                      alt="Main image preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => {
                        setMainImage(null)
                        setMainImagePreview(null)
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : null}

                {/* Additional Images */}
                {mainImage && (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Additional Photos (Optional)
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({additionalMedia.length}/4)</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-4 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 group">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleAdditionalMediaUpload}
                        className="hidden"
                        id="additional-media-upload"
                        disabled={additionalMedia.length >= 4}
                      />
                      <label htmlFor="additional-media-upload" className={`cursor-pointer ${additionalMedia.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:from-blue-100 group-hover:to-purple-100 transition-all duration-300 group-hover:scale-110">
                            <Plus size={16} className="text-gray-400 group-hover:text-blue-500" />
                          </div>
                          <div className="text-left">
                            <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">Add More Photos</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Up to 4 additional images</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {additionalMedia.length > 0 && (
                  <div className="grid grid-cols-6 gap-2">
                    {additionalMedia.map((file, index) => (
                      <div key={index} className="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Additional ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeAdditionalMedia(index)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={10} />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-blue-500 text-white px-1 py-0.5 rounded text-xs font-medium">
                          +{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audio Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Audio Files (Songs/Music) - Optional
                  {audioFiles.length > 0 && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({audioFiles.length}/20)</span>}
                </label>
                <div className="border-2 border-dashed border-purple-200 dark:border-purple-700 rounded-lg p-3 text-center hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all">
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files).slice(0, 20 - audioFiles.length)
                        setAudioFiles([...audioFiles, ...newFiles])
                      }
                    }}
                    className="hidden"
                    id="audio-upload"
                  />
                  <label htmlFor="audio-upload" className="cursor-pointer">
                    <Music size={20} className="mx-auto text-purple-500 mb-1" />
                    <p className="text-sm text-gray-600">Upload Audio Files</p>
                    <p className="text-xs text-gray-400">MP3, WAV, M4A, OGG, FLAC</p>
                  </label>
                </div>
                {audioFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {audioFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-purple-50 rounded text-xs">
                        <span className="truncate flex-1">🎵 {file.name}</span>
                        <button onClick={() => setAudioFiles(audioFiles.filter((_, i) => i !== idx))} className="text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Files - Optional
                  {videoFiles.length > 0 && <span className="text-xs text-gray-500 ml-2">({videoFiles.length}/10)</span>}
                </label>
                <div className="border-2 border-dashed border-blue-200 rounded-lg p-3 text-center hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="file"
                    accept="video/*,.mp4,.webm,.mov"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files).slice(0, 10 - videoFiles.length)
                        setVideoFiles([...videoFiles, ...newFiles])
                      }
                    }}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <Video size={20} className="mx-auto text-blue-500 mb-1" />
                    <p className="text-sm text-gray-600">Upload Video Files</p>
                    <p className="text-xs text-gray-400">MP4, WebM, MOV (max 500MB each)</p>
                  </label>
                </div>
                {videoFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {videoFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs">
                        <span className="truncate flex-1">🎬 {file.name}</span>
                        <button onClick={() => setVideoFiles(videoFiles.filter((_, i) => i !== idx))} className="text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Document Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documents (PDFs, etc.) - Optional
                  {documentFiles.length > 0 && <span className="text-xs text-gray-500 ml-2">({documentFiles.length}/10)</span>}
                </label>
                <div className="border-2 border-dashed border-amber-200 rounded-lg p-3 text-center hover:border-amber-400 hover:bg-amber-50 transition-all">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files).slice(0, 10 - documentFiles.length)
                        setDocumentFiles([...documentFiles, ...newFiles])
                      }
                    }}
                    className="hidden"
                    id="document-upload"
                  />
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <FileText size={20} className="mx-auto text-amber-500 mb-1" />
                    <p className="text-sm text-gray-600">Upload Documents</p>
                    <p className="text-xs text-gray-400">PDF, DOC, DOCX, TXT, XLS</p>
                  </label>
                </div>
                {documentFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {documentFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-amber-50 rounded text-xs">
                        <span className="truncate flex-1">📄 {file.name}</span>
                        <button onClick={() => setDocumentFiles(documentFiles.filter((_, i) => i !== idx))} className="text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Basic Content */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Content Details</h2>
                <p className="text-gray-600 text-xs">Add title, description, and tags</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Add title"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Describe your content..."
                    rows={4}
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                    <span className="text-xs text-gray-500 ml-2">(Optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => {
                        setVenue(e.target.value)
                        setShowLocationSuggestions(e.target.value.length > 0)
                      }}
                      onFocus={() => {
                        if (venue.length > 0) setShowLocationSuggestions(true)
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowLocationSuggestions(false), 200)
                      }}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Add location"
                    />
                    
                    {/* Location Suggestions Dropdown */}
                    {showLocationSuggestions && (
                      <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                        <div className="p-2 space-y-1">
                          <div className="text-xs font-semibold text-gray-500 px-2 py-1 sticky top-0 bg-white">
                            Suggestions • Or type any custom location
                          </div>
                          {(() => {
                            // Compact world locations
                            const locations = ['Dublin, Ireland', 'Cork, Ireland', 'London, UK', 'Manchester, UK', 'New York, USA', 'Los Angeles, USA', 'San Francisco, USA', 'Paris, France', 'Berlin, Germany', 'Madrid, Spain', 'Barcelona, Spain', 'Rome, Italy', 'Amsterdam, Netherlands', 'Tokyo, Japan', 'Dubai, UAE', 'Singapore, Singapore']
                            
                            const filtered = locations.filter(loc => 
                              loc.toLowerCase().includes(venue.toLowerCase())
                            ).slice(0, 8)
                            
                            return filtered.length > 0 ? filtered.map((location, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  setVenue(location)
                                  setShowLocationSuggestions(false)
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors text-sm text-gray-700 hover:text-blue-600"
                              >
                                📍 {location}
                              </button>
                            )) : (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                ✓ Using "{venue}"
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Start typing to see suggestions or enter any custom location
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Add tags..."
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-2 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-2 w-4 h-4 bg-blue-200 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-300 transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Post Type */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Post Type</h2>
                <p className="text-gray-600 text-xs">Choose how you want to share your content</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setPostType('free')}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                    postType === 'free'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      postType === 'free' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Gift size={16} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">Free Post</h3>
                      <p className="text-sm text-gray-600">Share content for free with your community</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setPostType('marketplace')}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                    postType === 'marketplace'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      postType === 'marketplace' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <CreditCard size={16} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">Marketplace Post</h3>
                      <p className="text-sm text-gray-600">Sell products, services, or digital content</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Marketplace Setup */}
          {step === 4 && postType === 'marketplace' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Marketplace Setup</h2>
                <p className="text-gray-600 text-xs">Configure your transaction type and pricing</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { category: 'ticketing_attendance', label: 'Events & Tickets', icon: Calendar },
                      { category: 'bookings_reservations', label: 'Bookings & Reservations', icon: Clock },
                      { category: 'purchases_ecommerce', label: 'Products & Services', icon: CreditCard },
                      { category: 'digital_access_media', label: 'Digital Media', icon: Video },
                      { category: 'video_series', label: 'Video Content', icon: Video },
                      { category: 'music_album', label: 'Music & Audio', icon: Music },
                      { category: 'documents_software', label: 'Documents & Software', icon: FileText },
                      { category: 'donations_crowdfunding', label: 'Donations', icon: Heart },
                      { category: 'memberships_subscriptions', label: 'Memberships', icon: Users },
                      { category: 'rentals_leases', label: 'Rentals & Leases', icon: Home },
                      { category: 'free_trial_rsvp', label: 'Free & Trials', icon: Gift }
                    ].map(({ category, label, icon: Icon }) => (
                      <button
                        key={category}
                        onClick={() => {
                          setTransactionCategory(category as TransactionCategory)
                          const subtypes = getTransactionSubtypes(category as TransactionCategory)
                          if (subtypes.length > 0) {
                            setTransactionSubtype(subtypes[0])
                          }
                        }}
                        className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                          transactionCategory === category
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <Icon size={16} className={transactionCategory === category ? 'text-blue-500' : 'text-gray-500'} />
                          <span className="text-xs text-center font-medium leading-tight">{label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtype</label>
                  <select
                    value={transactionSubtype}
                    onChange={(e) => setTransactionSubtype(e.target.value as TransactionSubtype)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {getTransactionSubtypes(transactionCategory).map(subtype => (
                      <option key={subtype} value={subtype}>
                        {subtype.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Simple Price (Always visible) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (C$)</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Set your base price. You can add multiple pricing tiers below.</p>
                </div>

                {/* Multiple Pricing Options (Advanced) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Additional Pricing Tiers (Optional)
                    <span className="text-xs text-gray-500 ml-2">
                      (e.g., General/VIP tickets, Different room types, Package tiers)
                    </span>
                  </label>
                  
                  {/* Add new pricing option */}
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        value={newPricingName}
                        onChange={(e) => setNewPricingName(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="e.g., General Admission, VIP, Suite"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newPricingPrice}
                        onChange={(e) => setNewPricingPrice(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <input
                      type="text"
                      value={newPricingDescription}
                      onChange={(e) => setNewPricingDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mb-2"
                      placeholder="Description (optional)"
                    />
                    <input
                      type="number"
                      min="1"
                      value={newPricingAvailability}
                      onChange={(e) => setNewPricingAvailability(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mb-2"
                      placeholder="Availability/Quantity (optional)"
                    />
                    <button
                      onClick={addPricingOption}
                      disabled={!newPricingName.trim() || !newPricingPrice.trim()}
                      className="w-full py-2 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Add Pricing Option
                    </button>
                  </div>

                  {/* Display pricing options */}
                  {pricingOptions.length > 0 && (
                    <div className="space-y-2">
                      {pricingOptions.map((option) => (
                        <div key={option.id} className={`relative p-3 border-2 rounded-lg transition-all ${
                          option.isPopular 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          {option.isPopular && (
                            <div className="absolute -top-2 left-3">
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                Popular
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900 text-sm">{option.name}</h4>
                                <span className="text-sm font-bold text-green-600">
                                  {option.price} {currency}
                                </span>
                              </div>
                              {option.description && (
                                <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                              )}
                              {option.availability && (
                                <p className="text-xs text-blue-600 mt-1">{option.availability} available</p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => togglePopular(option.id)}
                                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                  option.isPopular
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {option.isPopular ? 'Popular' : 'Make Popular'}
                              </button>
                              <button
                                onClick={() => removePricingOption(option.id)}
                                className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category-specific fields */}
                {(transactionCategory === 'ticketing_attendance' || transactionCategory === 'bookings_reservations') && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                        <input
                          type="time"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Venue</label>
                        <input
                          type="text"
                          value={venue}
                          onChange={(e) => setVenue(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Event venue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Capacity</label>
                        <input
                          type="number"
                          min="1"
                          value={capacity}
                          onChange={(e) => setCapacity(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Max attendees"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-3 flex justify-between items-center border-t border-gray-200 flex-shrink-0">
          <button
            onClick={step === 1 ? handleClose : handleBack}
            className="px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <button
            onClick={(step === 4 || (step === 3 && postType === 'free')) ? handleSubmit : handleNext}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 
             (step === 4 || (step === 3 && postType === 'free')) ? 'Create Post' : 'Next'}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
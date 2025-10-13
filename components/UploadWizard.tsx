'use client'

import { useState, useEffect } from 'react'
import { X, ArrowLeft, ArrowRight, Check, Upload, Music, Calendar, Car, Briefcase, Star } from 'lucide-react'
import { UploadType, UploadData, UploadWizardStep } from '@/types/upload'
import { ImageService } from '@/services/imageService'

// Import step components
import TypeSelectionStep from './upload-steps/TypeSelectionStep'
import BasicInfoStep from './upload-steps/BasicInfoStep'
import MediaUploadStep from './upload-steps/MediaUploadStep'
import ListingDetailsStep from './upload-steps/ListingDetailsStep'
import EventDetailsStep from './upload-steps/EventDetailsStep'
import MusicDetailsStep from './upload-steps/MusicDetailsStep'
import RentalDetailsStep from './upload-steps/RentalDetailsStep'
import ServiceDetailsStep from './upload-steps/ServiceDetailsStep'
import ExperienceDetailsStep from './upload-steps/ExperienceDetailsStep'
import GroupDetailsStep from './upload-steps/GroupDetailsStep'
import ReviewStep from './upload-steps/ReviewStep'
import { ContentService } from '@/services/contentService'

interface UploadWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (contentId: string) => void
}

export default function UploadWizard({ isOpen, onClose, onSuccess }: UploadWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [uploadData, setUploadData] = useState<Partial<UploadData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Define wizard steps
  const steps: UploadWizardStep[] = [
    {
      id: 'type-selection',
      title: 'Choose Content Type',
      description: 'What would you like to create?',
      component: TypeSelectionStep,
      required: true
    },
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Title, description, and category',
      component: BasicInfoStep,
      required: true
    },
    {
      id: 'media-upload',
      title: 'Media Upload',
      description: 'Upload images and files',
      component: MediaUploadStep,
      required: true
    },
    {
      id: 'type-specific',
      title: 'Details',
      description: 'Specific information for your content type',
      component: getTypeSpecificStep,
      required: true
    },
    {
      id: 'review',
      title: 'Review & Publish',
      description: 'Review your content before publishing',
      component: ReviewStep,
      required: true
    }
  ]

  function getTypeSpecificStep(uploadType: UploadType) {
    switch (uploadType) {
      case 'listing':
        return ListingDetailsStep
      case 'event':
        return EventDetailsStep
      case 'music':
        return MusicDetailsStep
      case 'rental':
        return RentalDetailsStep
      case 'service':
        return ServiceDetailsStep
      case 'experience':
        return ExperienceDetailsStep
      case 'group':
        return GroupDetailsStep
      default:
        return BasicInfoStep // For posts, just show basic info again
    }
  }

  const currentStepData = steps[currentStep]
  const CurrentStepComponent = currentStepData.component

  // Get the appropriate component for type-specific step
  const TypeSpecificComponent = uploadData.type ? getTypeSpecificStep(uploadData.type) : BasicInfoStep

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setErrors([])
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setErrors([])
    }
  }

  const handleDataChange = (newData: Partial<UploadData>) => {
    setUploadData(prev => ({ ...prev, ...newData }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrors([])

    try {
      // Upload images
      let imageUrls: string[] = []
      if (uploadData.images && uploadData.images.length > 0) {
        const uploadResult = await ImageService.uploadImages(uploadData.images, 'content-images', 'listings')
        if (uploadResult.success && uploadResult.urls) {
          imageUrls = uploadResult.urls
        } else {
          throw new Error(uploadResult.error || 'Failed to upload images')
        }
      }

      // Upload audio files
      let audioUrls: string[] = []
      if ((uploadData as any).audioFiles && (uploadData as any).audioFiles.length > 0) {
        const audioFiles = (uploadData as any).audioFiles as File[]
        for (const audioFile of audioFiles) {
          const audioUploadResult = await ImageService.uploadImage(
            audioFile,
            'media',
            'audio'
          )
          if (audioUploadResult.success && audioUploadResult.url) {
            audioUrls.push(audioUploadResult.url)
          } else {
            throw new Error(audioUploadResult.error || `Failed to upload audio: ${audioFile.name}`)
          }
        }
      }

      // Upload video files
      let videoUrls: string[] = []
      if ((uploadData as any).videoFiles && (uploadData as any).videoFiles.length > 0) {
        const videoFiles = (uploadData as any).videoFiles as File[]
        for (const videoFile of videoFiles) {
          const videoUploadResult = await ImageService.uploadImage(
            videoFile,
            'media',
            'videos'
          )
          if (videoUploadResult.success && videoUploadResult.url) {
            videoUrls.push(videoUploadResult.url)
          } else {
            throw new Error(videoUploadResult.error || `Failed to upload video: ${videoFile.name}`)
          }
        }
      }

      // Upload document files
      let documentUrls: string[] = []
      if ((uploadData as any).documentFiles && (uploadData as any).documentFiles.length > 0) {
        const documentFiles = (uploadData as any).documentFiles as File[]
        for (const documentFile of documentFiles) {
          const documentUploadResult = await ImageService.uploadImage(
            documentFile,
            'media',
            'documents'
          )
          if (documentUploadResult.success && documentUploadResult.url) {
            documentUrls.push(documentUploadResult.url)
          } else {
            throw new Error(documentUploadResult.error || `Failed to upload document: ${documentFile.name}`)
          }
        }
      }

      // Create content based on type
      const contentData = {
        ...uploadData,
        media_url: imageUrls[0] || videoUrls[0],
        media_urls: imageUrls,
        audio_url: audioUrls[0],
        audio_urls: audioUrls,
        video_url: videoUrls[0],
        video_urls: videoUrls,
        document_urls: documentUrls,
        content_type: uploadData.type === 'post' ? 'post' : 
                     uploadData.type === 'group' ? 'group' : 'listing',
        is_published: true,
        is_safety_approved: true, // Auto-approve for now
        moderation_status: 'approved' as const
      }

      // Submit to database
      const result = await ContentService.createContent(contentData)
      
      if (result.success) {
        onSuccess?.(result.contentId!)
        onClose()
        // Reset form
        setUploadData({})
        setCurrentStep(0)
      } else {
        setErrors([result.error || 'Failed to create content'])
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'An unexpected error occurred'])
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Type selection
        return !!uploadData.type
      case 1: // Basic info
        return !!(uploadData.title && uploadData.description && uploadData.category)
      case 2: // Media upload
        return true // Media is optional
      case 3: // Type-specific details
        return validateTypeSpecificData()
      case 4: // Review
        return true
      default:
        return false
    }
  }

  const validateTypeSpecificData = () => {
    switch (uploadData.type) {
      case 'listing':
        return !!(uploadData as any).price && !!(uploadData as any).currency
      case 'event':
        return !!(uploadData as any).startDate && !!(uploadData as any).startTime && !!(uploadData as any).venue
      case 'music':
        return !!(uploadData as any).audioFiles && (uploadData as any).audioFiles.length > 0
      case 'rental':
        return !!(uploadData as any).dailyRate && !!(uploadData as any).currency
      case 'service':
        return !!(uploadData as any).pricing && !!(uploadData as any).currency
      case 'experience':
        return !!(uploadData as any).pricePerPerson && !!(uploadData as any).currency
      case 'group':
        return true // Groups just need basic info
      default:
        return true
    }
  }

  const getStepIcon = (stepIndex: number) => {
    if (stepIndex < currentStep) return <Check className="w-5 h-5" />
    if (stepIndex === currentStep) {
      switch (uploadData.type) {
        case 'music': return <Music className="w-5 h-5" />
        case 'event': return <Calendar className="w-5 h-5" />
        case 'rental': return <Car className="w-5 h-5" />
        case 'service': return <Briefcase className="w-5 h-5" />
        case 'experience': return <Star className="w-5 h-5" />
        default: return <Upload className="w-5 h-5" />
      }
    }
    return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Content</h2>
            <p className="text-gray-600">{currentStepData.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {getStepIcon(index)}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <ul className="text-red-600 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {currentStep === 0 && (
            <TypeSelectionStep
              data={uploadData}
              onChange={handleDataChange}
            />
          )}

          {currentStep === 1 && (
            <BasicInfoStep
              data={uploadData}
              onChange={handleDataChange}
            />
          )}

          {currentStep === 2 && (
            <MediaUploadStep
              data={uploadData}
              onChange={handleDataChange}
            />
          )}

          {currentStep === 3 && uploadData.type && (
            <TypeSpecificComponent
              data={uploadData}
              onChange={handleDataChange}
            />
          )}

          {currentStep === 4 && (
            <ReviewStep
              data={uploadData}
              onChange={handleDataChange}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Publishing...' : 'Publish'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


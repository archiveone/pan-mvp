import { supabase } from './supabase'

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(file: File, userId: string): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    const filePath = `chat-images/${fileName}`

    const { data, error } = await supabase.storage
      .from('messages')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('messages')
      .getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (error: any) {
    console.error('Error uploading image:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Upload video to Supabase Storage
 */
export async function uploadVideo(file: File, userId: string): Promise<UploadResult> {
  try {
    // Check file size (max 100MB for videos)
    if (file.size > 100 * 1024 * 1024) {
      return {
        success: false,
        error: 'Video too large. Maximum size is 100MB.'
      }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    const filePath = `chat-videos/${fileName}`

    const { data, error } = await supabase.storage
      .from('messages')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('messages')
      .getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (error: any) {
    console.error('Error uploading video:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Upload voice note
 */
export async function uploadVoiceNote(blob: Blob, userId: string): Promise<UploadResult> {
  try {
    const fileName = `${userId}/${Date.now()}.webm`
    const filePath = `voice-notes/${fileName}`

    const file = new File([blob], fileName, { type: 'audio/webm' })

    const { data, error } = await supabase.storage
      .from('messages')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('messages')
      .getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (error: any) {
    console.error('Error uploading voice note:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Record voice note
 */
export async function recordVoiceNote(): Promise<Blob | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream)
    const chunks: Blob[] = []

    return new Promise((resolve) => {
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        resolve(blob)
      }

      mediaRecorder.start()

      // Auto-stop after 5 minutes
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
      }, 5 * 60 * 1000)

      // Expose stop function
      ;(window as any).stopRecording = () => mediaRecorder.stop()
    })
  } catch (error) {
    console.error('Error recording voice note:', error)
    return null
  }
}

/**
 * Compress image before upload
 */
export async function compressImage(file: File, maxWidth: number = 1920): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          0.85
        )
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}


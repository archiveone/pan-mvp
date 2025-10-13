/**
 * WebRTC Video Chat Implementation
 * Peer-to-peer encrypted video calling
 */

import { supabase } from './supabase'

export interface CallOffer {
  conversationId: string
  callerId: string
  offer: RTCSessionDescriptionInit
}

export interface CallAnswer {
  conversationId: string
  answer: RTCSessionDescriptionInit
}

export interface IceCandidate {
  conversationId: string
  candidate: RTCIceCandidateInit
}

export class VideoCallManager {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private conversationId: string
  private userId: string
  private onRemoteStream?: (stream: MediaStream) => void
  private onCallEnd?: () => void

  constructor(conversationId: string, userId: string) {
    this.conversationId = conversationId
    this.userId = userId
  }

  /**
   * Initialize video call (caller side)
   */
  async startCall(
    localVideoElement: HTMLVideoElement,
    onRemoteStream: (stream: MediaStream) => void,
    onCallEnd: () => void
  ): Promise<void> {
    this.onRemoteStream = onRemoteStream
    this.onCallEnd = onCallEnd

    try {
      // Get user media (camera + microphone)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      localVideoElement.srcObject = this.localStream

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!)
      })

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        if (this.onRemoteStream) {
          this.onRemoteStream(event.streams[0])
        }
      }

      // Handle ICE candidates
      this.peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          await this.sendIceCandidate(event.candidate)
        }
      }

      // Create offer
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)

      // Send offer via Supabase
      await this.sendCallOffer(offer)

      console.log('📞 Call started, offer sent')
    } catch (error) {
      console.error('Error starting call:', error)
      this.endCall()
      throw error
    }
  }

  /**
   * Answer incoming call (receiver side)
   */
  async answerCall(
    offer: RTCSessionDescriptionInit,
    localVideoElement: HTMLVideoElement,
    onRemoteStream: (stream: MediaStream) => void,
    onCallEnd: () => void
  ): Promise<void> {
    this.onRemoteStream = onRemoteStream
    this.onCallEnd = onCallEnd

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { ideal: 1280 },
        audio: true
      })

      localVideoElement.srcObject = this.localStream

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })

      // Add local stream
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!)
      })

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        if (this.onRemoteStream) {
          this.onRemoteStream(event.streams[0])
        }
      }

      // Handle ICE candidates
      this.peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          await this.sendIceCandidate(event.candidate)
        }
      }

      // Set remote description
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))

      // Create answer
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)

      // Send answer
      await this.sendCallAnswer(answer)

      console.log('📞 Call answered')
    } catch (error) {
      console.error('Error answering call:', error)
      this.endCall()
      throw error
    }
  }

  /**
   * End call and cleanup
   */
  endCall(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.onCallEnd) {
      this.onCallEnd()
    }

    console.log('📞 Call ended')
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        return !audioTrack.enabled // Returns true if muted
      }
    }
    return false
  }

  /**
   * Toggle video
   */
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        return !videoTrack.enabled // Returns true if video off
      }
    }
    return false
  }

  // Private methods for signaling
  private async sendCallOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    await supabase
      .from('messages')
      .insert({
        conversation_id: this.conversationId,
        sender_id: this.userId,
        encrypted_content: JSON.stringify(offer),
        content_type: 'call_offer',
        preview: '📞 Video call',
        metadata: { callType: 'video' }
      })
  }

  private async sendCallAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await supabase
      .from('messages')
      .insert({
        conversation_id: this.conversationId,
        sender_id: this.userId,
        encrypted_content: JSON.stringify(answer),
        content_type: 'call_answer',
        preview: '📞 Answered call',
        metadata: { callType: 'video' }
      })
  }

  private async sendIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    await supabase
      .from('messages')
      .insert({
        conversation_id: this.conversationId,
        sender_id: this.userId,
        encrypted_content: JSON.stringify(candidate.toJSON()),
        content_type: 'ice_candidate',
        preview: '',
        metadata: { signaling: true }
      })
  }

  /**
   * Listen for incoming signaling messages
   */
  async handleSignalingMessage(message: any): Promise<void> {
    try {
      const data = JSON.parse(message.encrypted_content)

      switch (message.content_type) {
        case 'call_answer':
          if (this.peerConnection) {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data))
            console.log('📞 Received call answer')
          }
          break

        case 'ice_candidate':
          if (this.peerConnection && data.candidate) {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(data))
            console.log('🧊 ICE candidate added')
          }
          break
      }
    } catch (error) {
      console.error('Error handling signaling message:', error)
    }
  }
}

/**
 * Check if browser supports WebRTC
 */
export function supportsWebRTC(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.RTCPeerConnection
  )
}

/**
 * Check camera and microphone permissions
 */
export async function checkMediaPermissions(): Promise<{
  camera: boolean
  microphone: boolean
}> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    
    stream.getTracks().forEach(track => track.stop())
    
    return { camera: true, microphone: true }
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      return { camera: false, microphone: false }
    }
    
    // Try individually
    let camera = false
    let microphone = false

    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
      videoStream.getTracks().forEach(track => track.stop())
      camera = true
    } catch (e) {}

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStream.getTracks().forEach(track => track.stop())
      microphone = true
    } catch (e) {}

    return { camera, microphone }
  }
}


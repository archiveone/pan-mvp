import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Image as ImageIcon, Music, Type, Smile, Download, Check, Palette, Eraser } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface StoryCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (story: any) => void;
}

type EditorTool = 'draw' | 'text' | 'sticker' | 'music' | null;

const StoryCreator: React.FC<StoryCreatorProps> = ({ isOpen, onClose, onStoryCreated }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'capture' | 'edit' | 'preview'>('capture');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isLoading, setIsLoading] = useState(false);
  
  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  
  // Editor
  const [selectedTool, setSelectedTool] = useState<EditorTool>(null);
  const [drawColor, setDrawColor] = useState('#FF0000');
  const [drawSize, setDrawSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [drawings, setDrawings] = useState<any[]>([]);
  const [textOverlays, setTextOverlays] = useState<any[]>([]);
  const [stickers, setStickers] = useState<any[]>([]);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicTrack, setMusicTrack] = useState<string | undefined>(undefined);
  const [musicName, setMusicName] = useState<string | undefined>(undefined);
  
  const editCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (step === 'edit' && editCanvasRef.current && !canvasContext) {
      const ctx = editCanvasRef.current.getContext('2d');
      setCanvasContext(ctx);
    }
  }, [step]);

  useEffect(() => {
    return () => {
      // Cleanup camera stream
      if (stream) {
        console.log('🧹 Cleaning up camera stream');
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Stop camera if active
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      // Reset all states
      setStep('capture');
      setCameraActive(false);
      setCameraLoading(false);
      setVideoReady(false);
      setStream(null);
      setMediaFile(null);
      setMediaPreview(null);
      setSelectedTool(null);
      setDrawings([]);
      setTextOverlays([]);
      setStickers([]);
      setMusicFile(null);
      setMusicTrack(undefined);
      setMusicName(undefined);
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraLoading(true);
      setVideoReady(false);
      
      console.log('📷 Requesting camera access...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
      }
      
      // Request camera permission with more flexible constraints
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1080, max: 1920 },
          height: { ideal: 1920, max: 1920 }
        },
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Camera permission granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video metadata to load
        videoRef.current.onloadedmetadata = async () => {
          console.log('📹 Video metadata loaded');
          
          // Ensure video plays after setting srcObject
          try {
            await videoRef.current?.play();
            console.log('✅ Camera started successfully');
            setVideoReady(true);
            setCameraLoading(false);
          } catch (playError) {
            console.log('⚠️ Auto-play blocked, attempting manual play:', playError);
            setCameraLoading(false);
            setVideoReady(true);
          }
        };
        
        setStream(mediaStream);
        setCameraActive(true);
      }
    } catch (error) {
      console.error('❌ Error accessing camera:', error);
      setCameraLoading(false);
      
      // Provide more specific error messages
      let errorMessage = 'Could not access camera. ';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage += 'Please allow camera permissions in your browser settings.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage += 'No camera found on your device.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage += 'Camera is already in use by another application.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += 'Camera access is not supported on this device or browser.';
        } else {
          errorMessage += error.message || 'Unknown error occurred.';
        }
      }
      
      alert(errorMessage);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'story.jpg', { type: 'image/jpeg' });
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
        setMediaType('image');
        
        // Stop camera
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setCameraActive(false);
        }
        
        setStep('edit');
      }
    }, 'image/jpeg', 0.95);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      alert('Please upload an image or video file');
      return;
    }
    
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType(isImage ? 'image' : 'video');
    setStep('edit');
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = editCanvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Scale coordinates to match canvas internal resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (selectedTool !== 'draw') return;
    e.preventDefault();
    
    const point = getCanvasPoint(e);
    if (!point || !canvasContext) return;
    
    setIsDrawing(true);
    setLastPoint(point);
    
    canvasContext.beginPath();
    canvasContext.moveTo(point.x, point.y);
    canvasContext.strokeStyle = drawColor;
    canvasContext.lineWidth = drawSize;
    canvasContext.lineCap = 'round';
    canvasContext.lineJoin = 'round';
    
    // Save this drawing stroke
    const newStroke = {
      id: Date.now(),
      color: drawColor,
      size: drawSize,
      points: [point]
    };
    setDrawings([...drawings, newStroke]);
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || selectedTool !== 'draw') return;
    e.preventDefault();
    
    const point = getCanvasPoint(e);
    if (!point || !canvasContext || !lastPoint) return;
    
    canvasContext.lineTo(point.x, point.y);
    canvasContext.stroke();
    setLastPoint(point);
    
    // Update the last drawing stroke
    setDrawings(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1].points.push(point);
      }
      return updated;
    });
  };

  const handleDrawEnd = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  // Text editor state
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentTextColor, setCurrentTextColor] = useState('#FFFFFF');
  const [currentFontSize, setCurrentFontSize] = useState(36);
  const [currentFontFamily, setCurrentFontFamily] = useState('Inter');
  const [editingTextIndex, setEditingTextIndex] = useState<number | null>(null);

  const addTextOverlay = () => {
    setCurrentText('');
    setCurrentTextColor('#FFFFFF');
    setCurrentFontSize(36);
    setCurrentFontFamily('Inter');
    setEditingTextIndex(null);
    setShowTextEditor(true);
    setSelectedTool(null);
  };

  const saveTextOverlay = () => {
    if (currentText.trim()) {
      if (editingTextIndex !== null) {
        // Update existing text
        setTextOverlays(prev => prev.map((t, i) => 
          i === editingTextIndex ? {
            ...t,
            text: currentText.trim(),
            color: currentTextColor,
            fontSize: currentFontSize,
            fontFamily: currentFontFamily
          } : t
        ));
      } else {
        // Add new text
        const newText = {
          id: Date.now(),
          text: currentText.trim(),
          x: 50,
          y: 30,
          color: currentTextColor,
          fontSize: currentFontSize,
          fontFamily: currentFontFamily,
          fontWeight: 'bold'
        };
        setTextOverlays([...textOverlays, newText]);
        console.log('📝 Text overlay added:', newText);
      }
    }
    setShowTextEditor(false);
    setEditingTextIndex(null);
  };

  const deleteTextOverlay = (index: number) => {
    setTextOverlays(prev => prev.filter((_, i) => i !== index));
  };

  const addSticker = (emoji: string) => {
    const newSticker = {
      id: Date.now(),
      emoji,
      x: 50, // Center horizontally (percentage)
      y: 50, // Center vertically (percentage)
      size: 64,
      rotation: 0
    };
    setStickers([...stickers, newSticker]);
    console.log('😀 Sticker added:', newSticker);
    setSelectedTool(null);
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        alert('Please select an audio file');
        return;
      }
      setMusicFile(file);
      setMusicName(file.name);
      setMusicTrack(URL.createObjectURL(file));
      console.log('🎵 Music added:', file.name);
      setSelectedTool(null);
    }
  };

  const handlePublish = async () => {
    if (!mediaFile || !user) return;
    
    setIsLoading(true);
    
    try {
      console.log('📸 Starting story upload...');
      
      // 1. Upload media to Supabase Storage
      const { ImageService } = await import('../services/imageService');
      const { StoriesService } = await import('../services/storiesService');
      
      console.log('📤 Uploading to storage...');
      const uploadResult = await ImageService.uploadImage(
        mediaFile,
        'stories',
        `${user.id}/${Date.now()}`
      );
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Failed to upload media');
      }
      
      console.log('✅ Media uploaded:', uploadResult.url);
      
      // 2. Generate thumbnail for videos
      let thumbnailUrl: string | undefined;
      if (mediaType === 'video') {
        // For now, use the first frame or a placeholder
        // In production, you'd want to generate a proper video thumbnail
        thumbnailUrl = uploadResult.url;
      }
      
      // 3. Upload music if added
      let musicUrl: string | undefined;
      if (musicFile) {
        console.log('🎵 Uploading music...');
        const musicUploadResult = await ImageService.uploadImage(
          musicFile,
          'media',
          'audio'
        );
        if (musicUploadResult.success && musicUploadResult.url) {
          musicUrl = musicUploadResult.url;
          console.log('✅ Music uploaded:', musicUrl);
        }
      }
      
      // 4. Prepare editor data with proper tracking
      const editorDataToSave: any = {
        textOverlays: textOverlays.map(t => ({
          id: t.id,
          text: t.text,
          x: t.x,
          y: t.y,
          color: t.color,
          fontSize: t.fontSize,
          fontFamily: t.fontFamily,
          fontWeight: t.fontWeight
        })),
        stickers: stickers.map(s => ({
          id: s.id,
          emoji: s.emoji,
          x: s.x,
          y: s.y,
          size: s.size,
          rotation: s.rotation
        })),
        drawings: drawings.map(d => ({
          id: d.id,
          color: d.color,
          size: d.size,
          points: d.points
        })),
        musicName: musicName
      };
      
      // Save canvas drawing as image data URL if there are drawings
      if (editCanvasRef.current && drawings.length > 0) {
        const drawingDataUrl = editCanvasRef.current.toDataURL('image/png');
        editorDataToSave.drawingOverlay = drawingDataUrl;
      }
      
      console.log('💾 Saving story to database...');
      console.log('📊 Editor data:', {
        textOverlays: textOverlays.length,
        stickers: stickers.length,
        drawings: drawings.length,
        hasMusic: !!musicUrl
      });
      
      // 5. Create story in database
      const createResult = await StoriesService.createStory({
        user_id: user.id,
        media_url: uploadResult.url,
        media_type: mediaType,
        thumbnail_url: thumbnailUrl,
        duration: mediaType === 'video' ? 15 : 5,
        editor_data: editorDataToSave,
        audio_url: musicUrl,
        audio_name: musicName || undefined,
        caption: undefined
      });
      
      if (!createResult.success || !createResult.data) {
        throw new Error(createResult.error || 'Failed to create story');
      }
      
      console.log('✅ Story created successfully!');
      
      // 5. Show success message
      alert('✨ Story published successfully!');
      
      // 6. Close modal and trigger callback
      onStoryCreated(createResult.data);
      
    } catch (error) {
      console.error('❌ Error publishing story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish story';
      
      // Show specific error messages
      if (errorMessage.includes('bucket')) {
        alert('⚠️ Storage not set up. Please create a "stories" bucket in Supabase Storage and make it PUBLIC.');
      } else {
        alert(`❌ Failed to publish story: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-[100] flex items-center justify-center">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20 animate-pulse" />
      
      {/* Header - Responsive */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-20 safe-area-inset-top">
        <button
          onClick={onClose}
          className="group w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white hover:bg-white/20 active:bg-white/25 transition-all duration-300 hover:rotate-90 shadow-lg touch-manipulation flex-shrink-0"
        >
          <X size={18} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
        </button>
        
        {step === 'edit' && (
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handlePublish}
              disabled={isLoading}
              className="px-4 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-lime-400 via-lime-300 to-lime-400 rounded-2xl text-black text-sm sm:text-base font-bold hover:shadow-2xl hover:shadow-lime-500/50 active:shadow-lime-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 transform hover:scale-105 active:scale-95 touch-manipulation whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 sm:border-3 border-black border-t-transparent rounded-full animate-spin" />
                  <span className="animate-pulse hidden sm:inline">Publishing...</span>
                  <span className="animate-pulse sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Check size={18} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Publish Story</span>
                  <span className="sm:hidden">Publish</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Capture Step */}
      {step === 'capture' && (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 relative z-10">
          {cameraActive ? (
            <div className="relative w-full max-w-md mx-auto animate-in fade-in duration-500">
              {/* Square aspect ratio container - Mobile optimized */}
              <div className="relative aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/10 bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Loading overlay */}
                {cameraLoading && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
                    <div className="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-white text-sm sm:text-base font-medium">Starting camera...</p>
                  </div>
                )}
                
                {/* Vignette effect */}
                <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/30 pointer-events-none" />
                
                {/* Grid overlay for better composition (optional) */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                  <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                </div>
              </div>
              
              {/* Capture button with animation - Responsive */}
              {videoReady && !cameraLoading && (
                <div className="mt-6 sm:mt-8 flex flex-col items-center gap-3 sm:gap-4 animate-in fade-in zoom-in duration-300">
                  <button
                    onClick={capturePhoto}
                    className="relative group touch-manipulation"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-white to-gray-100 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-white/30 hover:ring-white/50 active:ring-white/60">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full border-4 border-gray-200 group-hover:border-gray-300 group-active:border-gray-400 transition-colors" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-lime-400 opacity-0 group-hover:opacity-20 transition-opacity animate-pulse" />
                  </button>
                  <p className="text-white/80 text-xs sm:text-sm font-medium">Tap to capture</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-8 md:space-y-10 px-4 animate-in fade-in zoom-in duration-700 w-full max-w-lg mx-auto">
              {/* Main camera button - Perfectly Centered */}
              <div className="flex justify-center w-full">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-lime-400 to-lime-300 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse" />
                  <button
                    onClick={startCamera}
                    disabled={cameraLoading}
                    className="relative w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-lime-400 via-lime-300 to-lime-400 rounded-full flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all duration-500 shadow-2xl hover:shadow-lime-500/50 group touch-manipulation disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {cameraLoading ? (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={64} className="text-black group-hover:scale-110 transition-transform sm:w-18 sm:h-18" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="text-center w-full">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent px-4">
                  Create Your Story
                </h2>
                <p className="text-white/60 text-base sm:text-lg px-4">Tap to take a photo</p>
              </div>
              
              {/* Divider */}
              <div className="flex items-center gap-3 sm:gap-4 w-full max-w-xs mx-auto px-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <span className="text-white/40 text-xs sm:text-sm font-medium whitespace-nowrap">OR</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>
              
              {/* Upload button - Responsive */}
              <label className="group inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-xl rounded-2xl text-white font-semibold cursor-pointer hover:bg-white/20 active:bg-white/25 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl touch-manipulation w-full max-w-xs">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform flex-shrink-0">
                  <ImageIcon size={20} className="sm:w-6 sm:h-6" />
                </div>
                <span className="text-base sm:text-lg whitespace-nowrap">Upload from Gallery</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Edit Step */}
      {step === 'edit' && mediaPreview && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-4 pb-32 sm:pb-40">
          {/* Media Preview Container - Square aspect ratio for mobile */}
          <div className="relative w-full max-w-md aspect-square flex items-center justify-center mx-auto">
            <div className="relative w-full h-full flex items-center justify-center rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-black">
              {mediaType === 'image' ? (
                <img
                  ref={imageRef}
                  src={mediaPreview}
                  alt="Story"
                  className="max-w-full max-h-full object-contain"
                  onLoad={(e) => {
                    // Set canvas size to match image
                    const img = e.currentTarget;
                    if (editCanvasRef.current) {
                      editCanvasRef.current.width = img.naturalWidth;
                      editCanvasRef.current.height = img.naturalHeight;
                      const ctx = editCanvasRef.current.getContext('2d');
                      setCanvasContext(ctx);
                    }
                  }}
                />
              ) : (
                <video
                  src={mediaPreview}
                  className="max-w-full max-h-full object-contain"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              )}
              
              {/* Drawing Canvas Overlay */}
              <canvas
                ref={editCanvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ 
                  cursor: selectedTool === 'draw' ? 'crosshair' : 'default',
                  touchAction: 'none'
                }}
                onMouseDown={handleDrawStart}
                onMouseMove={handleDrawMove}
                onMouseUp={handleDrawEnd}
                onMouseLeave={handleDrawEnd}
                onTouchStart={handleDrawStart}
                onTouchMove={handleDrawMove}
                onTouchEnd={handleDrawEnd}
              />
              
              {/* Text Overlays - Draggable and editable */}
              {textOverlays.map((text, index) => (
                <div
                  key={text.id}
                  draggable
                  onClick={() => {
                    setCurrentText(text.text);
                    setCurrentTextColor(text.color);
                    setCurrentFontSize(text.fontSize);
                    setCurrentFontFamily(text.fontFamily);
                    setEditingTextIndex(index);
                    setShowTextEditor(true);
                  }}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', index.toString());
                  }}
                  onDragEnd={(e) => {
                    const canvas = editCanvasRef.current;
                    if (!canvas) return;
                    const rect = canvas.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    
                    setTextOverlays(prev => prev.map((t, i) => 
                      i === index ? { ...t, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : t
                    ));
                  }}
                  style={{
                    position: 'absolute',
                    left: `${text.x}%`,
                    top: `${text.y}%`,
                    transform: 'translate(-50%, -50%)',
                    color: text.color,
                    fontSize: `${text.fontSize}px`,
                    fontFamily: text.fontFamily,
                    fontWeight: text.fontWeight,
                    textShadow: '3px 3px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)',
                    WebkitTextStroke: '1px rgba(0,0,0,0.3)',
                    cursor: 'move',
                    userSelect: 'none',
                    padding: '8px 16px',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    maxWidth: '90%',
                    textAlign: 'center'
                  }}
                >
                  {text.text}
                </div>
              ))}
              
              {/* Stickers - Positioned with percentages */}
              {stickers.map((sticker, index) => (
                <div
                  key={sticker.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', index.toString());
                  }}
                  onDragEnd={(e) => {
                    const canvas = editCanvasRef.current;
                    if (!canvas) return;
                    const rect = canvas.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    
                    setStickers(prev => prev.map((s, i) => 
                      i === index ? { ...s, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : s
                    ));
                  }}
                  style={{
                    position: 'absolute',
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${sticker.size}px`,
                    cursor: 'move',
                    userSelect: 'none',
                    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))',
                    zIndex: 10
                  }}
                >
                  {sticker.emoji}
                </div>
              ))}
              
              {/* Music Indicator */}
              {musicTrack && musicName && (
                <div className="absolute top-6 right-6 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full flex items-center gap-2 z-10">
                  <Music size={16} className="text-white" />
                  <span className="text-white text-sm font-medium max-w-[150px] truncate">{musicName}</span>
                  <button
                    onClick={() => {
                      setMusicFile(null);
                      setMusicTrack(undefined);
                      setMusicName(undefined);
                    }}
                    className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modern Editor Toolbar - Responsive */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-2xl px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-5 safe-area-inset-bottom">
            {/* Main Tools with modern design - Grid on mobile, flex on desktop */}
            <div className="grid grid-cols-4 gap-3 sm:flex sm:justify-around sm:items-center max-w-2xl mx-auto">
              <button
                onClick={() => setSelectedTool(selectedTool === 'draw' ? null : 'draw')}
                className={`group flex flex-col items-center gap-1.5 sm:gap-2 transition-all duration-300 touch-manipulation ${
                  selectedTool === 'draw' ? 'scale-110' : 'hover:scale-105 active:scale-95'
                }`}
              >
                <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  selectedTool === 'draw' 
                    ? 'bg-gradient-to-br from-lime-400 to-lime-300 shadow-lg shadow-lime-500/50' 
                    : 'bg-white/10 hover:bg-white/20 active:bg-white/25'
                }`}>
                  <Palette size={20} className={`sm:w-6 sm:h-6 ${selectedTool === 'draw' ? 'text-black' : 'text-white'}`} />
                  {selectedTool === 'draw' && (
                    <div className="absolute inset-0 rounded-2xl bg-lime-400 animate-ping opacity-20" />
                  )}
                </div>
                <span className={`text-[10px] sm:text-xs font-medium ${selectedTool === 'draw' ? 'text-lime-400' : 'text-white/80'}`}>
                  Draw
                </span>
              </button>
              
              <button
                onClick={addTextOverlay}
                className="group flex flex-col items-center gap-1.5 sm:gap-2 hover:scale-105 active:scale-95 transition-transform touch-manipulation"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/25 flex items-center justify-center transition-all duration-300">
                  <Type size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-white/80">Text</span>
              </button>
              
              <button
                onClick={() => setSelectedTool(selectedTool === 'sticker' ? null : 'sticker')}
                className={`group flex flex-col items-center gap-1.5 sm:gap-2 transition-all duration-300 touch-manipulation ${
                  selectedTool === 'sticker' ? 'scale-110' : 'hover:scale-105 active:scale-95'
                }`}
              >
                <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  selectedTool === 'sticker' 
                    ? 'bg-gradient-to-br from-lime-400 to-lime-300 shadow-lg shadow-lime-500/50' 
                    : 'bg-white/10 hover:bg-white/20 active:bg-white/25'
                }`}>
                  <Smile size={20} className={`sm:w-6 sm:h-6 ${selectedTool === 'sticker' ? 'text-black' : 'text-white'}`} />
                  {selectedTool === 'sticker' && (
                    <div className="absolute inset-0 rounded-2xl bg-lime-400 animate-ping opacity-20" />
                  )}
                </div>
                <span className={`text-[10px] sm:text-xs font-medium ${selectedTool === 'sticker' ? 'text-lime-400' : 'text-white/80'}`}>
                  Sticker
                </span>
              </button>
              
              <label className="group flex flex-col items-center gap-1.5 sm:gap-2 hover:scale-105 active:scale-95 transition-transform cursor-pointer touch-manipulation">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  musicTrack ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50' : 'bg-white/10 hover:bg-white/20 active:bg-white/25'
                }`}>
                  <Music size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
                <span className={`text-[10px] sm:text-xs font-medium ${musicTrack ? 'text-purple-400' : 'text-white/80'}`}>Music</span>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.ogg"
                  onChange={handleMusicUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Drawing Tools with modern slider - Responsive */}
            {selectedTool === 'draw' && (
              <div className="flex items-center gap-2 sm:gap-4 bg-black/40 backdrop-blur-xl rounded-2xl p-3 sm:p-4 animate-in slide-in-from-bottom duration-300 max-w-2xl mx-auto">
                <div className="relative flex-shrink-0">
                  <input
                    type="color"
                    value={drawColor}
                    onChange={(e) => setDrawColor(e.target.value)}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl cursor-pointer border-2 border-white/20 hover:border-white/40 transition-colors touch-manipulation"
                  />
                  <div className="absolute -inset-1 bg-gradient-to-r from-lime-400 to-lime-300 rounded-xl opacity-0 hover:opacity-20 transition-opacity pointer-events-none" />
                </div>
                
                <div className="flex-1 flex flex-col gap-1.5 sm:gap-2 min-w-0">
                  <div className="flex items-center justify-between text-white/60 text-[10px] sm:text-xs">
                    <span>Brush Size</span>
                    <span className="font-medium text-white">{drawSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={drawSize}
                    onChange={(e) => setDrawSize(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-modern touch-manipulation"
                  />
                </div>
                
                <button
                  onClick={() => {
                    if (canvasContext && editCanvasRef.current) {
                      canvasContext.clearRect(0, 0, editCanvasRef.current.width, editCanvasRef.current.height);
                    }
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg hover:shadow-red-500/50 flex-shrink-0 touch-manipulation"
                >
                  <Eraser size={18} className="text-white sm:w-5 sm:h-5" />
                </button>
              </div>
            )}

            {/* Sticker Picker with better grid - Responsive */}
            {selectedTool === 'sticker' && (
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-3 sm:p-4 animate-in slide-in-from-bottom duration-300 max-w-2xl mx-auto">
                <p className="text-white/60 text-[10px] sm:text-xs mb-2 sm:mb-3 text-center">Tap any emoji to add it</p>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 sm:gap-3 max-h-32 sm:max-h-40 overflow-y-auto custom-scrollbar">
                  {['😀', '😂', '🤣', '😍', '🥰', '😘', '😋', '😎', '🔥', '❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '👍', '👏', '🙌', '💪', '✨', '⭐', '🌟', '💫', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '💯', '🚀'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addSticker(emoji)}
                      className="text-2xl sm:text-4xl hover:scale-125 active:scale-95 transition-all duration-200 hover:rotate-12 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-xl p-1.5 sm:p-2 flex items-center justify-center touch-manipulation"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <p className="text-white/40 text-[10px] sm:text-xs mt-2 sm:mt-3 text-center">Drag to reposition after adding</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Text Editor Modal - Responsive */}
      {showTextEditor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-white/10 sticky top-0 bg-gradient-to-br from-gray-900 to-black z-10">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Add Text</h3>
              <p className="text-white/60 text-xs sm:text-sm">Customize your text overlay</p>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Text Input */}
              <div>
                <label className="block text-white/80 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Text</label>
                <textarea
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  placeholder="Type your text..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/50 transition-all resize-none text-sm sm:text-base touch-manipulation"
                  rows={3}
                  autoFocus
                />
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-white/80 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Font</label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {[
                    { name: 'Classic', value: 'Inter' },
                    { name: 'Modern', value: 'Arial' },
                    { name: 'Serif', value: 'Georgia' },
                    { name: 'Bold', value: 'Impact' },
                    { name: 'Handwriting', value: 'cursive' },
                    { name: 'Mono', value: 'monospace' }
                  ].map((font) => (
                    <button
                      key={font.value}
                      onClick={() => setCurrentFontFamily(font.value)}
                      className={`px-2 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all touch-manipulation active:scale-95 ${
                        currentFontFamily === font.value
                          ? 'bg-gradient-to-r from-lime-400 to-lime-300 text-black shadow-lg'
                          : 'bg-white/10 text-white hover:bg-white/20 active:bg-white/25'
                      }`}
                      style={{ fontFamily: font.value }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <label className="text-white/80 text-xs sm:text-sm font-medium">Size</label>
                  <span className="text-white text-xs sm:text-sm font-bold">{currentFontSize}px</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="72"
                  value={currentFontSize}
                  onChange={(e) => setCurrentFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-modern touch-manipulation"
                />
              </div>

              {/* Text Color */}
              <div>
                <label className="block text-white/80 text-xs sm:text-sm font-medium mb-2 sm:mb-3">Color</label>
                <div className="flex items-start gap-2 sm:gap-3">
                  <input
                    type="color"
                    value={currentTextColor}
                    onChange={(e) => setCurrentTextColor(e.target.value)}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl cursor-pointer border-2 border-white/20 flex-shrink-0 touch-manipulation"
                  />
                  <div className="flex-1 grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2">
                    {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setCurrentTextColor(color)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl transition-all hover:scale-110 active:scale-95 touch-manipulation ${
                          currentTextColor === color ? 'ring-2 ring-lime-400 ring-offset-1 sm:ring-offset-2 ring-offset-gray-900' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-black/40 rounded-2xl p-4 sm:p-6 flex items-center justify-center min-h-[80px] sm:min-h-[100px]">
                <p
                  style={{
                    color: currentTextColor,
                    fontSize: `${Math.min(currentFontSize, 48)}px`,
                    fontFamily: currentFontFamily,
                    fontWeight: 'bold',
                    textShadow: '3px 3px 8px rgba(0,0,0,0.9)',
                    WebkitTextStroke: '1px rgba(0,0,0,0.3)',
                    textAlign: 'center'
                  }}
                >
                  {currentText || 'Your text here'}
                </p>
              </div>
            </div>

            {/* Footer - Sticky Bottom */}
            <div className="p-4 sm:p-6 bg-black/40 flex gap-2 sm:gap-3 border-t border-white/10 sticky bottom-0">
              <button
                onClick={() => {
                  setShowTextEditor(false);
                  setEditingTextIndex(null);
                }}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 rounded-xl text-white text-sm sm:text-base font-semibold hover:bg-white/20 active:bg-white/25 transition-all touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={saveTextOverlay}
                disabled={!currentText.trim()}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-lime-400 to-lime-300 rounded-xl text-black text-sm sm:text-base font-bold hover:brightness-95 active:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {editingTextIndex !== null ? 'Update' : 'Add Text'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Step - Square for mobile - Responsive */}
      {step === 'preview' && mediaPreview && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in zoom-in duration-500">
          {/* Square Preview - Mobile optimized */}
          <div className="relative w-full max-w-md aspect-square mx-auto">
            <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/10 bg-black">
              {mediaType === 'image' ? (
                <img src={mediaPreview} alt="Story preview" className="w-full h-full object-cover" />
              ) : (
                <video src={mediaPreview} className="w-full h-full object-cover" autoPlay loop muted playsInline />
              )}
              {/* Preview label */}
              <div className="absolute top-4 sm:top-6 left-4 sm:left-6 px-3 sm:px-4 py-1.5 sm:py-2 bg-black/60 backdrop-blur-xl rounded-full">
                <span className="text-white text-xs sm:text-sm font-medium">Preview</span>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-4 px-4 w-full max-w-md justify-center">
            <button
              onClick={() => setStep('edit')}
              disabled={isLoading}
              className="px-4 sm:px-8 py-2.5 sm:py-4 bg-white/10 backdrop-blur-xl rounded-2xl text-white text-sm sm:text-base font-semibold hover:bg-white/20 active:bg-white/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg touch-manipulation whitespace-nowrap"
            >
              <span className="hidden sm:inline">← Edit More</span>
              <span className="sm:hidden">← Edit</span>
            </button>
            <button
              onClick={handlePublish}
              disabled={isLoading}
              className="flex-1 sm:flex-none px-6 sm:px-10 py-2.5 sm:py-4 bg-gradient-to-r from-lime-400 via-lime-300 to-lime-400 rounded-2xl text-black text-sm sm:text-base font-bold hover:shadow-2xl hover:shadow-lime-500/50 active:shadow-lime-500/30 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 touch-manipulation"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 sm:border-3 border-black border-t-transparent rounded-full animate-spin" />
                  <span className="animate-pulse hidden sm:inline">Publishing...</span>
                  <span className="animate-pulse sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Check size={20} className="sm:w-6 sm:h-6" />
                  <span className="text-base sm:text-lg">Publish Story</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryCreator;


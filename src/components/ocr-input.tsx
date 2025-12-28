import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Check, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LanguageSelector } from '@/components/language-selector'
import { extractTextFromImageFn } from '@/server-fns/ocr'

interface OcrInputProps {
  onExtract: (text: string, language: string) => void
  isLoading?: boolean
}

const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_IMAGE_DIMENSION = 2048 // pixels

export function OcrInput({ onExtract, isLoading }: OcrInputProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [language, setLanguage] = useState<string>('auto')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [hasCamera, setHasCamera] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  
  const extractText = useServerFn(extractTextFromImageFn)
  
  // Check camera availability on mount
  useEffect(() => {
    setHasCamera(!!navigator.mediaDevices?.getUserMedia)
  }, [])
  
  // Cleanup camera and image URLs on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])
  
  // Validate image file
  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    if (!VALID_MIME_TYPES.includes(file.type as any)) {
      return {
        valid: false,
        error: 'Unsupported file type. Please use JPEG, PNG, WebP, or GIF.',
      }
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      }
    }
    
    return { valid: true }
  }
  
  // Compress image
  const compressImage = useCallback(
    async (file: File): Promise<File> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        img.onload = () => {
          let width = img.width
          let height = img.height
          
          // Calculate new dimensions maintaining aspect ratio
          if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
            const ratio = Math.min(
              MAX_IMAGE_DIMENSION / width,
              MAX_IMAGE_DIMENSION / height
            )
            width *= ratio
            height *= ratio
          }
          
          canvas.width = width
          canvas.height = height
          
          ctx?.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: file.type }))
              } else {
                reject(new Error('Failed to compress image'))
              }
            },
            file.type,
            0.85
          )
        }
        
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = URL.createObjectURL(file)
      })
    },
    []
  )
  
  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }
    
    setError(null)
    
    try {
      const compressed = await compressImage(file)
      setImageFile(compressed)
      setImageUrl(URL.createObjectURL(compressed))
      setExtractedText(null)
    } catch (err) {
      setError('Failed to process image. Please try again.')
      console.error(err)
    }
  }
  
  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
      }
    } catch (err) {
      setError('Camera access denied. Please check your browser permissions.')
      console.error(err)
    }
  }
  
  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }
  
  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' })
        setImageFile(file)
        setImageUrl(URL.createObjectURL(file))
        setExtractedText(null)
        stopCamera()
      }
    }, 'image/jpeg', 0.85)
  }
  
  // Extract text
  const handleExtract = async () => {
    if (!imageFile) return
    
    setIsProcessing(true)
    setError(null)
    
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(imageFile)
      })
      
      // Remove data URL prefix
      const imageData = base64.split(',')[1]
      
      // Call server function
      const result = await extractText({
        data: {
          imageData,
          languageHint: language === 'auto' ? undefined : language,
        },
      })
      
      setExtractedText(result.text)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to extract text. Please try again.'
      )
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Use extracted text
  const handleUseText = () => {
    if (extractedText) {
      onExtract(extractedText, language)
      // Reset state
      setImageFile(null)
      setImageUrl(null)
      setExtractedText(null)
      setError(null)
    }
  }
  
  // Clear image
  const handleClearImage = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
    }
    setImageFile(null)
    setImageUrl(null)
    setExtractedText(null)
    setError(null)
    stopCamera()
  }
  
  return (
    <Card className="p-4 md:p-6">
      <div className="space-y-4">
        {/* Language Selector */}
        <div className="flex items-center justify-between">
          <LanguageSelector
            value={language}
            onChange={setLanguage}
            disabled={isProcessing || isLoading}
          />
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
            {error}
          </div>
        )}
        
        {/* Image Input Area */}
        {!imageFile ? (
          <div className="space-y-3">
            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || isLoading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </Button>
              
              {hasCamera && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={startCamera}
                  disabled={isProcessing || isLoading}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </Button>
              )}
            </div>
            
            {/* Camera View */}
            {isCameraActive && (
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <Button
                    type="button"
                    size="lg"
                    onClick={capturePhoto}
                    disabled={isProcessing}
                    className="rounded-full w-16 h-16 bg-white hover:bg-gray-100 text-black"
                  >
                    <div className="w-12 h-12 bg-black rounded-full border-4 border-gray-300" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={stopCamera}
                    disabled={isProcessing}
                    className="rounded-full w-12 h-12"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Image Preview */}
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
              <img
                src={imageUrl || ''}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleClearImage}
                disabled={isProcessing}
                className="absolute top-2 right-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Extract Button */}
            {!extractedText && (
              <Button
                type="button"
                onClick={handleExtract}
                disabled={isProcessing || isLoading}
                className="w-full gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting Text...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Extract Text
                  </>
                )}
              </Button>
            )}
          </div>
        )}
        
        {/* Extracted Text Preview */}
        {extractedText && (
          <div className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm font-medium mb-2">Extracted Text:</p>
              <p className="text-sm whitespace-pre-wrap">{extractedText}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClearImage}
                disabled={isProcessing}
              >
                Try Another Image
              </Button>
              <Button
                type="button"
                onClick={handleUseText}
                disabled={isProcessing || isLoading}
                className="flex-1"
              >
                Use This Text
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

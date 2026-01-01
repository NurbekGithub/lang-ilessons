import { useMemo, useRef, useState } from 'react'
import { Check, Loader2, Scissors, Upload, X } from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LanguageSelector } from '@/components/language-selector'
import { ImageCropper } from '@/components/image-cropper'
import { extractTextFromImageFn } from '@/server-fns/ocr'

interface OcrInputProps {
  onExtract: (text: string, language: string) => void
  isLoading?: boolean
}

const VALID_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
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

const MAX_IMAGE_DIMENSION = 2048 // pixels
const compressImage = async (file: File): Promise<File> => {
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
          MAX_IMAGE_DIMENSION / height,
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
        0.85,
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export function OcrInput({ onExtract, isLoading }: OcrInputProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [croppedFile, setCroppedFile] = useState<File | null>(null)
  const [language, setLanguage] = useState<string>('auto')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const extractText = useServerFn(extractTextFromImageFn)

  const croppedImageUrl = useMemo(() => {
    if (croppedFile) {
      return URL.createObjectURL(croppedFile)
    }

    return null
  }, [croppedFile])

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
      setCroppedFile(compressed)
      setExtractedText(null)
      setShowCropper(true)
    } catch (err) {
      setError('Failed to process image. Please try again.')
      console.error(err)
    }
  }

  // Extract text
  const handleExtract = async () => {
    if (!croppedFile) return

    setIsProcessing(true)
    setError(null)

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(croppedFile)
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
        err instanceof Error
          ? err.message
          : 'Failed to extract text. Please try again.',
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
      // TODO(Nurbek): maybe use this instead?
      // handleClearImage()
      setImageFile(null)
      setCroppedFile(null)
      setExtractedText(null)
      setError(null)
    }
  }

  // Clear image
  const handleClearImage = () => {
    if (croppedImageUrl) {
      URL.revokeObjectURL(croppedImageUrl)
    }
    setImageFile(null)
    setCroppedFile(null)
    setExtractedText(null)
    setError(null)
    setShowCropper(false)
  }

  // Handle crop click
  const handleCropClick = () => {
    setShowCropper(true)
  }

  // Handle crop complete
  const handleCropComplete = (newFile: File) => {
    // Revoke old URL
    if (croppedImageUrl) {
      URL.revokeObjectURL(croppedImageUrl)
    }

    // Update with cropped image
    setCroppedFile(newFile)
    setExtractedText(null)
    setShowCropper(false)
  }

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropper(false)
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
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Image Preview */}
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
              <img
                src={croppedImageUrl || ''}
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

            {/* Action Buttons */}
            {!extractedText && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCropClick}
                  disabled={isProcessing || isLoading}
                  className="flex-1 gap-2"
                  aria-label="Crop image before extracting text"
                >
                  <Scissors className="w-4 h-4" />
                  Crop
                </Button>
                <Button
                  type="button"
                  onClick={handleExtract}
                  disabled={isProcessing || isLoading}
                  className="flex-1 gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Extract Text
                    </>
                  )}
                </Button>
              </div>
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

        {/* Image Cropper Modal */}
        {showCropper && imageFile && (
          <ImageCropper
            imageFile={imageFile}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        )}
      </div>
    </Card>
  )
}

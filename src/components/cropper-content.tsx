import { useCallback, useRef, useState } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import type { Crop, PixelCrop } from 'react-image-crop'
// import 'react-image-crop/dist/ReactCrop.css?url'
import { Button } from '@/components/ui/button'

export interface CropperContentProps {
  imageUrl: string
  aspectRatio?: number
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

export function CropperContent({
  imageUrl,
  aspectRatio,
  onConfirm,
  onCancel,
}: CropperContentProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imgRef = useRef<HTMLImageElement>(null)

  // Initialize crop when image loads
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget

      if (aspectRatio) {
        // Use centerCrop with makeAspectCrop for fixed aspect ratio
        const newCrop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: 90,
            },
            aspectRatio,
            width,
            height
          ),
          width,
          height
        )
        setCrop(newCrop)
      } else {
        // Default free-form crop
        setCrop({ unit: '%', width: 50, height: 50, x: 25, y: 25 })
      }
    },
    [aspectRatio]
  )

  // Update crop state (use percentage for responsiveness)
  const onCropChange = useCallback((_: Crop, percentCrop: Crop) => {
    setCrop(percentCrop)
  }, [])

  // Capture final crop data
  const handleCropComplete = useCallback((crop: PixelCrop) => {
    setCompletedCrop(crop)
  }, [])

  // Generate cropped file from canvas
  const generateCroppedFile = useCallback(async (): Promise<File | null> => {
    if (!completedCrop || !imgRef.current) return null

    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    // Get natural and displayed dimensions
    const naturalWidth = image.naturalWidth
    const naturalHeight = image.naturalHeight
    const displayedWidth = image.width
    const displayedHeight = image.height

    // Calculate scale factor from displayed to natural dimensions
    const scaleX = naturalWidth / displayedWidth
    const scaleY = naturalHeight / displayedHeight

    // Scale crop coordinates to natural dimensions
    const scaledCrop = {
      x: completedCrop.x * scaleX,
      y: completedCrop.y * scaleY,
      width: completedCrop.width * scaleX,
      height: completedCrop.height * scaleY
    }

    // Set canvas dimensions to scaled crop size
    canvas.width = scaledCrop.width
    canvas.height = scaledCrop.height

    // Draw cropped area onto canvas using natural dimensions
    ctx.drawImage(
      image,
      scaledCrop.x,
      scaledCrop.y,
      scaledCrop.width,
      scaledCrop.height,
      0,
      0,
      scaledCrop.width,
      scaledCrop.height
    )

    // Convert canvas to blob and create File
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
    })

    if (!blob) return null

    return new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' })
  }, [completedCrop])

  // Handle crop confirmation
  const handleConfirm = useCallback(async () => {
    const croppedFile = await generateCroppedFile()
    if (croppedFile) {
      onConfirm(croppedFile)
    }
  }, [generateCroppedFile, onConfirm])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-muted/30">
        <ReactCrop
          crop={crop}
          onChange={onCropChange}
          onComplete={handleCropComplete}
          aspect={aspectRatio}
          className="max-w-full"
        >
          <img
            ref={imgRef}
            src={imageUrl}
            onLoad={onImageLoad}
            alt="Crop preview"
            className="max-w-full max-h-[60vh] object-contain"
          />
        </ReactCrop>
      </div>
      <div className="p-4 border-t bg-background flex gap-2 shrink-0">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          aria-label="Cancel cropping"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!completedCrop}
          className="flex-1"
          aria-label="Confirm and apply crop"
        >
          Confirm Crop
        </Button>
      </div>
    </div>
  )
}

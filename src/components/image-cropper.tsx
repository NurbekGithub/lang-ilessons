import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { CropperContent } from '@/components/cropper-content'

export interface ImageCropperProps {
  imageFile: File
  onCropComplete: (croppedFile: File) => void
  onCancel: () => void
  aspectRatio?: number
}

export function ImageCropper({
  imageFile,
  onCropComplete,
  onCancel,
  aspectRatio,
}: ImageCropperProps) {
  const [isMobile, setIsMobile] = useState(false)
  const imageUrl = useMemo(() => URL.createObjectURL(imageFile), [imageFile])

  // Detect mobile/desktop
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <>
      {/* Mobile Drawer - only visible on mobile */}
      {isMobile && (
        <Drawer open={true} onOpenChange={onCancel}>
          <DrawerContent className="h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Crop Image</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 min-h-0">
              <CropperContent
                imageUrl={imageUrl}
                aspectRatio={aspectRatio}
                onConfirm={onCropComplete}
                onCancel={onCancel}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Desktop Dialog - only visible on desktop */}
      {!isMobile && (
        <Dialog open={true} onOpenChange={onCancel}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>Crop Image</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0">
              <CropperContent
                imageUrl={imageUrl}
                aspectRatio={aspectRatio}
                onConfirm={onCropComplete}
                onCancel={onCancel}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

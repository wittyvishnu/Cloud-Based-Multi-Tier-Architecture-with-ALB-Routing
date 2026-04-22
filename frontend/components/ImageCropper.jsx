'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

export default function ImageCropper({ imageSource, onCrop, onCancel, aspectRatio = 1 }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 200 })
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const img = new window.Image()
    img.src = imageSource
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height })
    }
  }, [imageSource])

  const handleMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const startX = e.clientX - rect.left
    const startY = e.clientY - rect.top
    const startCrop = { ...crop }

    const handleMouseMove = (moveEvent) => {
      const currentX = moveEvent.clientX - rect.left
      const currentY = moveEvent.clientY - rect.top

      const deltaX = currentX - startX
      const deltaY = currentY - startY

      const newX = Math.max(0, Math.min(startCrop.x + deltaX, 300 - crop.size))
      const newY = Math.max(0, Math.min(startCrop.y + deltaY, 300 - crop.size))

      setCrop({ ...crop, x: newX, y: newY })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleCrop = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const img = new window.Image()
    img.src = imageSource
    
    img.onload = () => {
      const size = crop.size
      const scaleX = imageDimensions.width / 300
      const scaleY = imageDimensions.height / 300

      canvas.width = size
      canvas.height = size

      ctx.drawImage(
        img,
        crop.x * scaleX,
        crop.y * scaleY,
        size * scaleX,
        size * scaleY,
        0,
        0,
        size,
        size
      )

      canvas.toBlob((blob) => {
        onCrop(blob)
      }, 'image/jpeg', 0.95)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Crop Image</h2>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Preview area */}
          <div
            ref={imgRef}
            onMouseDown={handleMouseDown}
            className="relative w-full h-80 bg-muted rounded-lg overflow-hidden cursor-move border-2 border-border mb-6"
            style={{
              backgroundImage: `url(${imageSource})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Crop box */}
            <div
              className="absolute border-2 border-primary bg-transparent"
              style={{
                left: `${(crop.x / 300) * 100}%`,
                top: `${(crop.y / 300) * 100}%`,
                width: `${(crop.size / 300) * 100}%`,
                height: `${(crop.size / 300) * 100}%`,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              }}
            />
          </div>

          {/* Size slider */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Zoom: {Math.round((crop.size / 300) * 100)}%
            </label>
            <input
              type="range"
              min="100"
              max="300"
              value={crop.size}
              onChange={(e) => {
                const newSize = parseInt(e.target.value)
                const maxX = 300 - newSize
                const maxY = 300 - newSize
                setCrop({
                  x: Math.min(crop.x, maxX),
                  y: Math.min(crop.y, maxY),
                  size: newSize,
                })
              }}
              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Preview */}
          <div className="mb-6 flex justify-center">
            <div
              className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-border"
              style={{
                backgroundImage: `url(${imageSource})`,
                backgroundSize: `${300 / (crop.size / 300)}px ${300 / (crop.size / 300)}px`,
                backgroundPosition: `-${crop.x * (300 / (crop.size / 300)) / 300}px -${crop.y * (300 / (crop.size / 300)) / 300}px`,
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-background hover:bg-primary/90 transition font-semibold"
            >
              Crop & Save
            </button>
          </div>
        </div>
      </div>

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

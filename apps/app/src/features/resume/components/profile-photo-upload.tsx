import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Upload, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

import { api } from '#/lib/api'

type ProfilePhotoUploadProps = {
  value: string
  onChange: (url: string) => void
  className?: string
  buttonSize?: number
  accept?: string
  maxSizeInBytes?: number
  disabled?: boolean
}

export function ProfilePhotoUpload({
  value,
  onChange,
  className = '',
  buttonSize = 72,
  accept = 'image/*',
  maxSizeInBytes = 5 * 1024 * 1024,
  disabled = false,
}: ProfilePhotoUploadProps) {
  const previewRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    setPreviewUrl(value || null)
  }, [value])

  const handleThumbnailClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }, [disabled, isUploading])

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (file.size > maxSizeInBytes) {
        setError(
          `File size exceeds ${maxSizeInBytes / 1024 / 1024}MB limit.`,
        )
        return
      }

      setFileName(file.name)
      setError(null)
      const blobUrl = URL.createObjectURL(file)
      setPreviewUrl(blobUrl)
      previewRef.current = blobUrl
      setIsUploading(true)

      try {
        const result = await api.upload.put(file, {
          folder: 'profile-photos',
        })
        onChange(result.data.url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload image')
        setPreviewUrl(value || null)
      } finally {
        setIsUploading(false)
        if (previewRef.current) {
          URL.revokeObjectURL(previewRef.current)
          previewRef.current = null
        }
        event.target.value = ''
      }
    },
    [maxSizeInBytes, onChange, value],
  )

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (disabled || isUploading) return
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
        previewRef.current = null
      }
      setFileName(null)
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onChange('')
      setError(null)
    },
    [disabled, isUploading, onChange],
  )

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }
    }
  }, [])

  const displayUrl = previewUrl ?? value

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleThumbnailClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleThumbnailClick()
          }
        }}
        className={cn(
          'relative inline-flex w-fit border-2 border-dashed border-input rounded-lg p-4 transition-colors',
          !disabled && !isUploading && 'cursor-pointer hover:bg-accent',
        )}
      >
        <div
          className={cn('flex items-center', {
            'justify-center': !displayUrl,
          })}
        >
          {displayUrl ? (
            <div
              className="relative"
              style={{ width: buttonSize, height: buttonSize }}
            >
              <img
                src={displayUrl}
                alt="Profile"
                className={cn(
                  'size-full rounded-lg object-cover',
                  isUploading && 'opacity-50',
                )}
              />
              {isUploading && (
                <div className="absolute inset-x-0 bottom-0 p-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/20">
                    <div className="h-full animate-pulse rounded-full bg-primary" />
                  </div>
                  <p className="mt-1 text-center text-[10px] font-medium text-primary">
                    Uploading…
                  </p>
                </div>
              )}
              {!disabled && !isUploading && (
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={handleRemove}
                  className="absolute -right-2 -top-2 size-6 rounded-full border-2 border-background"
                  aria-label="Remove photo"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-2 text-muted-foreground"
              style={{ width: buttonSize, height: buttonSize }}
            >
              <Upload size={24} />
              <span className="text-xs">Upload image</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            aria-label="Upload image file"
          />
        </div>
      </div>
      {fileName && (
        <p className="mt-2 text-xs text-muted-foreground">{fileName}</p>
      )}
      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
      <div className="sr-only" role="status" aria-live="polite">
        {isUploading
          ? 'Uploading image...'
          : displayUrl
            ? 'Image uploaded and preview available'
            : 'No image uploaded'}
      </div>
    </div>
  )
}

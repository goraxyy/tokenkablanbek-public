export const MAX_PHOTOS_PER_REQUEST = 12
export const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
])

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

/**
 * Derives the stored extension from the validated MIME type rather than the
 * client-supplied filename, so an upload cannot choose the extension it is
 * served under.
 */
export function getSafeExtension(file: File) {
  return MIME_TO_EXTENSION[file.type] ?? 'jpg'
}

export function validatePhoto(photo: File): string | null {
  if (!photo || photo.size === 0) return 'One of the selected photos is empty or invalid'
  if (!ALLOWED_IMAGE_TYPES.has(photo.type)) return 'Unsupported file type'
  if (photo.size > MAX_FILE_SIZE_BYTES) return 'Each image must be under 6MB'
  return null
}

export function validatePhotos(photos: File[]): string | null {
  if (photos.length > MAX_PHOTOS_PER_REQUEST) {
    return `You can upload up to ${MAX_PHOTOS_PER_REQUEST} photos at a time`
  }
  for (const photo of photos) {
    const error = validatePhoto(photo)
    if (error) return error
  }
  return null
}

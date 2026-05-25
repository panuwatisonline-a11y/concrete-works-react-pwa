export type ImageUploadProvider = 'google_drive' | 'r2'

export const IMAGE_UPLOAD_PROVIDER_LABEL: Record<ImageUploadProvider, string> = {
  google_drive: 'Google Drive',
  r2: 'Cloudflare R2',
}

export const IMAGE_UPLOAD_PROVIDER_OPTIONS: ImageUploadProvider[] = [
  'google_drive',
  'r2',
]

export function isImageUploadProvider(v: string): v is ImageUploadProvider {
  return v === 'google_drive' || v === 'r2'
}

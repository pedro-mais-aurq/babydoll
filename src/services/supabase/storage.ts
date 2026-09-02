import { getSupabaseClient } from './client'

const IMAGE_BUCKET = 'images'

export function getPublicImageUrl(storagePath: string): string {
  const { data } = getSupabaseClient().storage.from(IMAGE_BUCKET).getPublicUrl(storagePath)

  return data.publicUrl
}

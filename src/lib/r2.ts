import type { Manifest, PhotoMeta } from '@/types'

export async function getManifest(bucket: R2Bucket): Promise<Manifest> {
  const obj = await bucket.get('_manifest.json')
  if (!obj) return { photos: [] }
  return (await obj.json()) as Manifest
}

export async function putManifest(bucket: R2Bucket, manifest: Manifest): Promise<void> {
  await bucket.put('_manifest.json', JSON.stringify(manifest), {
    httpMetadata: { contentType: 'application/json' },
  })
}

export function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/heic': 'heic',
    'image/heif': 'heif',
  }
  return map[mime] ?? 'jpg'
}

export function photoKey(photo: PhotoMeta): string {
  return photo.key
}

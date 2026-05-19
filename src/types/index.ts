export interface PhotoMeta {
  id: string
  key: string
  contentType: string
  caption: string
  location: string
  date: string
  device: string
  tags: string[]
  uploadedAt: number
}

export interface Manifest {
  photos: PhotoMeta[]
}

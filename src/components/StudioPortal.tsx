'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { PhotoMeta } from '@/types'

export default function StudioPortal() {
  const [photos, setPhotos] = useState<PhotoMeta[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [device, setDevice] = useState('')
  const [tags, setTags] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadPhotos = useCallback(async () => {
    const r = await fetch('/api/photos')
    const { photos } = (await r.json()) as { photos: PhotoMeta[] }
    setPhotos(photos ?? [])
  }, [])

  useEffect(() => { loadPhotos() }, [loadPhotos])

  function onFiles(files: FileList | File[]) {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'))
    setSelectedFiles(imgs)
    setPreviews(imgs.map(f => URL.createObjectURL(f)))
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (selectedFiles.length === 0) return
    setUploading(true)
    setUploadProgress(0)

    for (let i = 0; i < selectedFiles.length; i++) {
      const fd = new FormData()
      fd.append('image', selectedFiles[i])
      fd.append('caption', caption)
      fd.append('location', location)
      fd.append('date', date)
      fd.append('device', device)
      fd.append('tags', tags)
      await fetch('/api/photos', { method: 'POST', body: fd })
      setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100))
    }

    setSelectedFiles([])
    setPreviews([])
    setCaption(''); setLocation(''); setDate(''); setDevice(''); setTags('')
    setUploading(false)
    setUploadProgress(0)
    await loadPhotos()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/photos/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="studio">
      <header className="studio-header">
        <span className="studio-header-title">Studio</span>
        <div className="studio-header-right">
          <a href="/" className="studio-back">← Portfolio</a>
        </div>
      </header>

      <div className="studio-body">
        {/* Upload panel */}
        <section className="studio-section">
          <h2 className="studio-section-title">Upload photographs</h2>
          <form onSubmit={handleUpload}>
            <div
              className={`drop-zone${dragOver ? ' drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files) }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={e => e.target.files && onFiles(e.target.files)}
              />
              {previews.length === 0 ? (
                <div className="drop-inner">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                  <p>Drag &amp; drop or click to select</p>
                  <p className="drop-hint">JPG · PNG · WEBP · HEIC — any size</p>
                </div>
              ) : (
                <div className="drop-previews" onClick={e => e.stopPropagation()}>
                  {previews.map((src, i) => (
                    <img key={i} src={src} alt="" className="drop-thumb" />
                  ))}
                  <button
                    type="button"
                    className="drop-change"
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <div className="form-fields">
              <div className="field-group">
                <label className="field-label" htmlFor="caption">Caption</label>
                <input className="field-input" id="caption" type="text" value={caption}
                  onChange={e => setCaption(e.target.value)} placeholder="What does this photograph mean?" />
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label className="field-label" htmlFor="location">Location</label>
                  <input className="field-input" id="location" type="text" value={location}
                    onChange={e => setLocation(e.target.value)} placeholder="City, Country" />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="date">Date</label>
                  <input className="field-input" id="date" type="date" value={date}
                    onChange={e => setDate(e.target.value)} />
                </div>
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label className="field-label" htmlFor="device">Camera / Device</label>
                  <input className="field-input" id="device" type="text" value={device}
                    onChange={e => setDevice(e.target.value)} placeholder="e.g. Fujifilm X100VI" />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="tags">Tags</label>
                  <input className="field-input" id="tags" type="text" value={tags}
                    onChange={e => setTags(e.target.value)} placeholder="street, portrait, travel" />
                </div>
              </div>
            </div>

            {uploading && (
              <div className="upload-progress">
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                <span>{uploadProgress}%</span>
              </div>
            )}

            <button className="btn-submit" type="submit" disabled={uploading || selectedFiles.length === 0}>
              {uploading ? `Uploading… ${uploadProgress}%` : `Save ${selectedFiles.length > 1 ? `${selectedFiles.length} photos` : 'photo'} to gallery`}
            </button>
          </form>
        </section>

        {/* Photo management grid */}
        <section className="studio-section">
          <h2 className="studio-section-title">Gallery — {photos.length} photographs</h2>
          {photos.length === 0 ? (
            <p className="studio-empty">No photos yet. Upload your first one above.</p>
          ) : (
            <div className="studio-grid">
              {photos.map(photo => (
                <div key={photo.id} className="studio-thumb">
                  <img src={`/api/photos/${photo.id}/image`} alt={photo.caption || ''} />
                  <div className="studio-thumb-meta">
                    {photo.caption && <p className="studio-thumb-caption">{photo.caption}</p>}
                    {photo.location && <p className="studio-thumb-info">{photo.location}</p>}
                    {photo.date && <p className="studio-thumb-info">{photo.date}</p>}
                    {photo.tags.length > 0 && (
                      <div className="studio-thumb-tags">
                        {photo.tags.map(t => <span key={t}>{t}</span>)}
                      </div>
                    )}
                  </div>
                  {deleteConfirm === photo.id ? (
                    <div className="studio-delete-confirm">
                      <span>Delete?</span>
                      <button onClick={() => handleDelete(photo.id)}>Yes</button>
                      <button onClick={() => setDeleteConfirm(null)}>No</button>
                    </div>
                  ) : (
                    <button className="studio-delete-btn" onClick={() => setDeleteConfirm(photo.id)} aria-label="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

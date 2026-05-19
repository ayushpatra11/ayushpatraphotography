'use client'

import { useEffect, useCallback } from 'react'
import type { PhotoMeta } from '@/types'

interface Props {
  photos: PhotoMeta[]
  index: number
  onClose: () => void
  onNavigate: (i: number) => void
  onDelete?: (id: string) => void
}

function formatDate(d: string) {
  if (!d) return ''
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch { return d }
}

export default function Lightbox({ photos, index, onClose, onNavigate, onDelete }: Props) {
  const photo = photos[index]

  const prev = useCallback(() => { if (index > 0) onNavigate(index - 1) }, [index, onNavigate])
  const next = useCallback(() => { if (index < photos.length - 1) onNavigate(index + 1) }, [index, photos.length, onNavigate])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, prev, next])

  if (!photo) return null

  const metaItems = [
    photo.location && { prefix: 'At', text: photo.location },
    photo.date && { prefix: 'On', text: formatDate(photo.date) },
    photo.device && { prefix: 'Via', text: photo.device },
  ].filter(Boolean) as { prefix: string; text: string }[]

  return (
    <div className="lightbox" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <button className="lightbox-arrow lightbox-prev" onClick={prev} disabled={index === 0} aria-label="Previous">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <button className="lightbox-arrow lightbox-next" onClick={next} disabled={index === photos.length - 1} aria-label="Next">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      <div className="lightbox-stage">
        <img
          key={photo.id}
          className="lightbox-img"
          src={`/api/photos/${photo.id}/image`}
          alt={photo.caption || ''}
        />
      </div>

      <div className="lightbox-meta">
        {photo.caption && <p className="lightbox-caption">{photo.caption}</p>}
        {metaItems.length > 0 && (
          <div className="lightbox-info">
            {metaItems.map(m => (
              <span key={m.prefix} className="lightbox-info-item">
                <span className="lightbox-info-prefix">{m.prefix}</span>{m.text}
              </span>
            ))}
          </div>
        )}
        {photo.tags.length > 0 && (
          <div className="lightbox-tags">
            {photo.tags.map(t => <span key={t} className="lightbox-tag">{t}</span>)}
          </div>
        )}
        {onDelete && (
          <button
            className="lightbox-delete"
            onClick={() => {
              if (confirm('Delete this photograph?')) onDelete(photo.id)
            }}
          >
            Delete
          </button>
        )}
      </div>

      <div className="lightbox-counter">{index + 1} / {photos.length}</div>
    </div>
  )
}

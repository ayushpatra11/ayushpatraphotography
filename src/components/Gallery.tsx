'use client'

import { useState, useEffect, useRef } from 'react'
import type { PhotoMeta } from '@/types'
import Lightbox from './Lightbox'

const PAGE = 12

function formatDate(d: string) {
  if (!d) return ''
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return d }
}

export default function Gallery() {
  const [photos, setPhotos] = useState<PhotoMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [rendered, setRendered] = useState(PAGE)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const heroTitle1 = useRef<HTMLSpanElement>(null)
  const heroTitle2 = useRef<HTMLSpanElement>(null)
  const heroSub = useRef<HTMLDivElement>(null)
  const heroDivider = useRef<HTMLDivElement>(null)
  const heroTagline = useRef<HTMLParagraphElement>(null)
  const scrollIndicator = useRef<HTMLDivElement>(null)
  const headerLogo = useRef<HTMLAnchorElement>(null)
  const headerNav = useRef<HTMLElement>(null)

  // Fetch all photo metadata once (small JSON), render progressively in batches
  useEffect(() => {
    fetch('/api/photos')
      .then(r => r.json() as Promise<{ photos: PhotoMeta[] }>)
      .then(({ photos }) => setPhotos(photos ?? []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false))
  }, [])

  // When the sentinel div scrolls into view (400px before bottom of viewport),
  // add the next batch of images to the DOM. This keeps concurrent edge requests
  // capped at ~PAGE instead of firing N requests all at once on page load.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || loading) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRendered(n => Math.min(n + PAGE, photos.length))
      },
      { rootMargin: '400px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loading, photos.length])

  // Hero GSAP animation on mount
  useEffect(() => {
    let cleanup: (() => void) | undefined

    async function animate() {
      const { gsap } = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)

      const tl = gsap.timeline()
      tl.to([heroTitle1.current, heroTitle2.current], {
        y: 0, opacity: 1, stagger: 0.1, duration: 1.1, ease: 'power4.out',
      })
        .to(heroSub.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
        .to(heroDivider.current, { width: 80, opacity: 1, duration: 0.7, ease: 'power2.out' }, '-=0.4')
        .to(heroTagline.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
        .to(scrollIndicator.current, { opacity: 1, duration: 0.5 }, '-=0.2')
        .to([headerLogo.current, headerNav.current], { opacity: 1, y: 0, stagger: 0.07, duration: 0.6, ease: 'power3.out' }, '-=0.8')

      cleanup = () => tl.kill()
    }

    animate()
    return () => cleanup?.()
  }, [])

  // Header scroll shadow
  useEffect(() => {
    const header = document.getElementById('header')
    if (!header) return
    function onScroll() {
      header!.classList.toggle('scrolled', window.scrollY > 60)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])


  const visiblePhotos = photos.slice(0, rendered)

  return (
    <>
      {/* Header */}
      <header id="header">
        <a ref={headerLogo} className="header-logo" href="/" style={{ opacity: 0, transform: 'translateY(-8px)' }}>AP</a>
        <nav ref={headerNav} className="header-nav" style={{ opacity: 0, transform: 'translateY(-8px)' }}>
          <a href="https://www.instagram.com/patrasarchive/" target="_blank" rel="noopener noreferrer" className="nav-instagram" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/>
              <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/>
            </svg>
            <span>@patrasarchive</span>
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section ref={heroRef} id="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span ref={heroTitle1} className="hero-line" style={{ opacity: 0, transform: 'translateY(110%)' }}>AYUSH</span>
            <span ref={heroTitle2} className="hero-line" style={{ opacity: 0, transform: 'translateY(110%)' }}>PATRA</span>
          </h1>
          <div ref={heroSub} className="hero-sub" style={{ opacity: 0, transform: 'translateY(20px)' }}>PHOTOGRAPHY</div>
          <div ref={heroDivider} className="hero-divider" style={{ width: 0, opacity: 0 }} />
          <p ref={heroTagline} className="hero-tagline" style={{ opacity: 0, transform: 'translateY(12px)' }}>
            Moments in light &amp; shadow
          </p>
        </div>
        <div ref={scrollIndicator} className="hero-scroll-indicator" style={{ opacity: 0 }}>
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery">
        <div className="gallery-header">
          <span className="gallery-count">
            {loading ? '—' : `${photos.length} ${photos.length === 1 ? 'photograph' : 'photographs'}`}
          </span>
        </div>

        {!loading && photos.length === 0 && (
          <div className="gallery-empty">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <p className="empty-title">Your story begins here</p>
            <p className="empty-sub">Visit <code>/studio</code> to upload your first photograph</p>
          </div>
        )}

        <div className="gallery-grid">
          {visiblePhotos.map((photo, i) => {
            const meta = [
              photo.location && { prefix: 'At', text: photo.location },
              photo.date && { prefix: 'On', text: formatDate(photo.date) },
              photo.device && { prefix: 'Via', text: photo.device },
            ].filter(Boolean) as { prefix: string; text: string }[]

            return (
              <div
                key={photo.id}
                className="gallery-item"
                style={{ animationDelay: `${(i % 3) * 0.06}s` }}
                onClick={() => setLightboxIndex(i)}
                role="button"
                tabIndex={0}
                aria-label={photo.caption || `Photo ${i + 1}`}
                onKeyDown={e => e.key === 'Enter' && setLightboxIndex(i)}
              >
                <img
                  className="gallery-item-img"
                  src={`/api/photos/${photo.id}/image`}
                  alt={photo.caption || ''}
                  loading="lazy"
                  onLoad={e => (e.currentTarget.closest('.gallery-item') as HTMLElement | null)?.classList.add('img-loaded')}
                />
                <div className="gallery-item-caption">
                  {photo.caption && <p className="caption-text">{photo.caption}</p>}
                  <div className="caption-meta">
                    {meta.map(m => (
                      <span key={m.prefix} className="caption-meta-item" data-prefix={m.prefix}>{m.text}</span>
                    ))}
                  </div>
                  {photo.tags.length > 0 && (
                    <div className="caption-tags">
                      {photo.tags.map(t => <span key={t} className="caption-tag">{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Sentinel: becomes visible 400px before the viewport bottom, triggering the next batch */}
          {!loading && rendered < photos.length && (
            <div ref={sentinelRef} className="gallery-sentinel" aria-hidden="true" />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer id="footer">
        <span className="footer-name">Ayush Patra Photography</span>
        <a href="https://www.instagram.com/patrasarchive/" target="_blank" rel="noopener noreferrer" className="footer-instagram">@patrasarchive</a>
      </footer>

      {/* Lightbox — receives full photos array so arrow navigation works across all photos */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  )
}

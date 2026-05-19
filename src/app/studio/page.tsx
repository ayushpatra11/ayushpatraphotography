import type { Metadata } from 'next'
import StudioPortal from '@/components/StudioPortal'

export const metadata: Metadata = {
  title: 'Studio — Ayush Patra Photography',
  robots: { index: false, follow: false },
}

export default function StudioPage() {
  return <StudioPortal />
}

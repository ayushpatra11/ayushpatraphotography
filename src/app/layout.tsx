import type { Metadata } from 'next'
import { Bebas_Neue, Space_Grotesk } from 'next/font/google'
import './globals.css'
import Grain from '@/components/Grain'
import Cursor from '@/components/Cursor'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Ayush Patra Photography',
  description: 'Photography portfolio by Ayush Patra — moments in light & shadow.',
  openGraph: {
    title: 'Ayush Patra Photography',
    description: 'Photography portfolio by Ayush Patra.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${spaceGrotesk.variable}`}>
      <body>
        <Grain />
        <Cursor />
        {children}
      </body>
    </html>
  )
}

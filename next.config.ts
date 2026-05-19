import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required for @cloudflare/next-on-pages
  // All API routes and server pages must declare: export const runtime = 'edge'
}

export default nextConfig

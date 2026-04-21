import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TaskHome - Micro-Task Marketplace',
    short_name: 'TaskHome',
    description: 'Connect with social media tasks and earn rewards.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#4c1d95',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}

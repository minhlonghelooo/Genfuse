import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Genfuse',
    short_name: 'Genfuse',
    description: 'Genfuse: ký ức, trò chơi và sự thấu hiểu cho ba thế hệ trong một gia đình.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ecebe7',
    theme_color: '#1f5c3f',
    lang: 'vi',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}

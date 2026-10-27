import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Baloo_2, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

// Fonts: `display: swap` shows text at once in a system font, then switches (no invisible text while they load).
const be = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'], variable: '--font-be', display: 'swap' });
const baloo = Baloo_2({ subsets: ['latin', 'vietnamese'], variable: '--font-baloo', display: 'swap' });
const grotesk = Space_Grotesk({ subsets: ['latin', 'vietnamese'], variable: '--font-grotesk', display: 'swap' });

const DESCRIPTION = 'Genfuse: cây ký ức, từ điển Gen Z, trò chơi và người bạn đồng hành cho ba thế hệ trong một gia đình.';

export const metadata: Metadata = {
  title: { default: 'Genfuse', template: '%s · Genfuse' },
  description: DESCRIPTION,
  applicationName: 'Genfuse',
  openGraph: { title: 'Genfuse', description: DESCRIPTION, siteName: 'Genfuse', type: 'website', locale: 'vi_VN' },
  twitter: { card: 'summary', title: 'Genfuse', description: DESCRIPTION },
  appleWebApp: { capable: true, title: 'Genfuse', statusBarStyle: 'default' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1f5c3f' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-theme="adult" data-font="sans" data-size="normal" className={`${be.variable} ${baloo.variable} ${grotesk.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

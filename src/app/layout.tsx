import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import SessionProvider from '@/providers/SessionProvider';
import QueryProvider from '@/providers/QueryProvider';
import ToastContainer from '@/components/ui/Toast';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL) : undefined,
  title: { default: 'MS Tech — Gestion de patrimoine', template: '%s — MS Tech' },
  description: 'Tout votre patrimoine sur un seul écran : comptes, répartition, frais, dividendes, budget et projections.',
  applicationName: 'MS Tech',
  appleWebApp: { capable: true, title: 'MS Tech', statusBarStyle: 'black-translucent' },
  icons: { icon: [{ url: '/favicon.ico' }, { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' }], apple: '/icons/apple-touch-icon.png' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0b',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0b] text-[#f5f5f5]">
        <SessionProvider>
          <QueryProvider>
            {children}
            <ToastContainer />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

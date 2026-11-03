import type { Metadata, Viewport } from 'next';
import { Geist, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { isRtl, routing } from '@/i18n/routing';
import { SERVER_ONLY_NAMESPACES } from '@/i18n/messages';
import LocaleSync from '@/providers/LocaleSync';
import SessionProvider from '@/providers/SessionProvider';
import QueryProvider from '@/providers/QueryProvider';
import ToastContainer from '@/components/ui/Toast';
import '../globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' });
// Only fetched when Arabic text is on screen, through its unicode-range.
const arabic = IBM_Plex_Sans_Arabic({ variable: '--font-arabic', subsets: ['arabic'], weight: ['400', '500', '600', '700'], display: 'swap', preload: false });

// Before first paint, so that a saved theme never flashes the other one.
const THEME_SCRIPT = `try{var t=localStorage.getItem('ms-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common.meta' });
  return {
    metadataBase: process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL) : undefined,
    title: { default: t('title'), template: '%s — Kenz' },
    description: t('description'),
    applicationName: 'Kenz',
    appleWebApp: { capable: true, title: 'Kenz', statusBarStyle: 'default' },
    icons: { icon: [{ url: '/favicon.ico' }, { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' }], apple: '/icons/apple-touch-icon.png' },
    formatDetection: { telephone: false },
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])) },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b0c' },
  ],
  colorScheme: 'light dark',
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const all = await getMessages();
  const messages = Object.fromEntries(Object.entries(all).filter(([ns]) => !(SERVER_ONLY_NAMESPACES as readonly string[]).includes(ns)));

  return (
    <html lang={locale} dir={isRtl(locale) ? 'rtl' : 'ltr'} className={`${geistSans.variable} ${arabic.variable} h-full antialiased`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
          <LocaleSync locale={locale} />
          <SessionProvider>
            <QueryProvider>
              {children}
              <ToastContainer />
            </QueryProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

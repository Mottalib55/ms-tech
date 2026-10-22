import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import SessionProvider from '@/providers/SessionProvider';
import QueryProvider from '@/providers/QueryProvider';
import ToastContainer from '@/components/ui/Toast';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MS Tech — Gestion de Patrimoine',
  description: 'Votre patrimoine, simplifié. Une solution par Market Securities.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
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

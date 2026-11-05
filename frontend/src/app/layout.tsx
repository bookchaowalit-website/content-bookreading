import type { Metadata } from 'next'
import { Inter, Sarabun, Noto_Sans_Thai } from 'next/font/google'
import '@/styles/globals.css'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { ToastProvider } from '@/providers/ToastProvider'

// Font variables go on <html> (design-floor adoption step: next/font classes on html, not body, so
// the variables resolve at the root). Noto Sans Thai is the default Thai face (thai-font rule);
// Sarabun stays loaded only for the reader's own font choice.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-sarabun',
})
const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-noto',
})

export const metadata: Metadata = {
  title: 'BookReading - อ่านนิยายแปลอัตโนมัติ',
  description: 'Platform for reading translated novels and manga with AI-powered translation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" suppressHydrationWarning className={`${inter.variable} ${sarabun.variable} ${notoSansThai.variable}`}>
      <body className="font-sans">
        {/* Skip Navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          ข้ามไปยังเนื้อหาหลัก
        </a>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

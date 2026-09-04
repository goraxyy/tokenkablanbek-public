import type { Metadata, Viewport } from 'next'
import { Playfair_Display } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: 'tokenkablanbek',
  description: 'Our love story, one memory at a time',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/images/main-icon.png', type: 'image/png' },
    ],
    shortcut: '/icon.svg',
    apple: '/images/main-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#f9a8d4',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Force favicon refresh by explicitly linking the SVG icon */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/images/main-icon.png" type="image/png" />
      </head>
      <body className={`${playfair.variable} antialiased`}>{children}</body>
    </html>
  )
}

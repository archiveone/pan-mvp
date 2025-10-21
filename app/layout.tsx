import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThemePreferencesProvider } from '@/contexts/ThemePreferencesContext'
import { ToastContainer } from '@/components/Toast'
import CookieConsent from '@/components/CookieConsent'
import InstallPrompt from '@/components/InstallPrompt'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Pan - Social Platform & Marketplace',
  description: 'A beautiful social platform with marketplace, messaging, hub system, and community features. Connect, share, and discover.',
  applicationName: 'Pan',
  keywords: ['social media', 'marketplace', 'community', 'messaging', 'hub', 'listings', 'events', 'shopping', 'social network'],
  authors: [{ name: 'Pan' }],
  creator: 'Pan',
  publisher: 'Pan',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://pan.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Pan - Social Platform & Marketplace',
    description: 'A beautiful social platform with marketplace, messaging, hub system, and community features. Connect, share, and discover.',
    url: '/',
    siteName: 'Pan',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pan - Social Platform & Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pan - Social Platform & Marketplace',
    description: 'A beautiful social platform with marketplace, messaging, hub system, and community features.',
    images: ['/og-image.png'],
    creator: '@pan',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pan',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/favicon_io/apple-touch-icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Pan" />
        <link rel="apple-touch-icon" href="/favicon_io/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon_io/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon_io/android-chrome-512x512.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <ThemePreferencesProvider>
              {children}
              <ToastContainer />
              <CookieConsent />
              <InstallPrompt />
            </ThemePreferencesProvider>
          </AuthProvider>
        </ThemeProvider>

        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('✅ Service Worker registered:', registration.scope);
                  },
                  function(err) {
                    console.log('❌ Service Worker registration failed:', err);
                  }
                );
              });
            }
          `}
        </Script>

        {/* Install prompt handler */}
        <Script id="install-prompt" strategy="afterInteractive">
          {`
            let deferredPrompt;
            window.addEventListener('beforeinstallprompt', (e) => {
              e.preventDefault();
              deferredPrompt = e;
              // Store for later use
              window.deferredPrompt = e;
            });
          `}
        </Script>
      </body>
    </html>
  )
}

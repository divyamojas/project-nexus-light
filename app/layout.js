import './globals.css'
import { ErrorBoundary } from '../components/ErrorBoundary.js'
import { AuthProvider } from '../components/AuthProvider.js'
import { ToastProvider } from '../components/Toast.js'
import AppChrome from '../components/AppChrome.js'

export const metadata = {
  title: 'Leaflet',
  description: 'Community book sharing',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" />
        <meta name="theme-color" content="#059669" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('leaflet-theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()` }} />
      </head>
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <AppChrome />
              <main>
                {children}
              </main>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

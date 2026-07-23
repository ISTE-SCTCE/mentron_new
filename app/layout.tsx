import type { Metadata } from "next"
import "./globals.css"
import { MobileNavbar } from "./components/MobileNavbar"
import { SidebarWrapper } from "./components/SidebarWrapper"
import { LoadingProvider } from "./lib/context/LoadingContext"
import { LoadingOverlay } from "./components/LoadingOverlay"
import { NavigationInterceptor } from "./components/NavigationInterceptor"
import { NavigationEventsWrapper } from "./components/NavigationEventsWrapper"

export const metadata: Metadata = {
  title: "Mentron | Your Academic Companion",
  description: "Access premium curated notes, syllabus, question papers, projects, and essential learning materials. ISTE SCTCE's official academic companion.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#F8F6FF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className="antialiased"
        style={{ background: '#F8F6FF', fontFamily: "'Inter', sans-serif" }}
      >
        <LoadingProvider>
          {/* Liquid Animated Background — pastel blobs like Flutter LiquidBackground */}
          <div
            className="liquid-blob"
            style={{
              width: '60vw',
              height: '60vw',
              background: 'rgba(108,99,255,0.12)',
              top: '-10%',
              left: '-10%',
              animationDuration: '18s',
            }}
          />
          <div
            className="liquid-blob"
            style={{
              width: '50vw',
              height: '50vw',
              background: 'rgba(255,140,105,0.10)',
              bottom: '-10%',
              right: '-10%',
              animationDuration: '22s',
              animationDirection: 'alternate-reverse',
            }}
          />
          <div
            className="liquid-blob"
            style={{
              width: '40vw',
              height: '40vw',
              background: 'rgba(78,205,196,0.08)',
              top: '40%',
              left: '20%',
              animationDuration: '15s',
              animationDelay: '3s',
            }}
          />

          <LoadingOverlay />
          <NavigationInterceptor />
          <NavigationEventsWrapper />

          <div className="relative z-10 w-full">
            <SidebarWrapper>{children}</SidebarWrapper>
          </div>

          {/* Flutter-style Bottom Navigation Pill */}
          <MobileNavbar />
        </LoadingProvider>
      </body>
    </html>
  )
}

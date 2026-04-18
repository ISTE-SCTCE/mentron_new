import type { Metadata } from "next";
import "@fontsource/space-grotesk/300.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./globals.css";
import LiquidBackground from "./components/LiquidBackground";
import { SidebarWrapper } from "./components/SidebarWrapper";
import { LoadingProvider } from "./lib/context/LoadingContext";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { NavigationInterceptor } from "./components/NavigationInterceptor";
import { NavigationEventsWrapper } from "./components/NavigationEventsWrapper";
import { GlobalSettingsIcon } from "./components/GlobalSettingsIcon";

export const metadata: Metadata = {
  title: "Mentron | Tech Community",
  description: "Join the most innovative developer community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`font-body antialiased`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <LoadingProvider>
          <LiquidBackground />
          <SidebarWrapper />
          <LoadingOverlay />
          <NavigationInterceptor />
          <NavigationEventsWrapper />
          <GlobalSettingsIcon />
          <div className="relative z-10 w-full">
            {children}
          </div>
        </LoadingProvider>
      </body>
    </html>
  );
}

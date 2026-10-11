"use client";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { SidebarWrapper } from "../SidebarWrapper";
import { LoadingOverlay } from "../LoadingOverlay";
import { NavigationInterceptor } from "../NavigationInterceptor";
import { NavigationEventsWrapper } from "../NavigationEventsWrapper";
import { PageTransition } from "../motion/PageTransition";
import { LoadingProvider } from "@/app/lib/context/LoadingContext";
import { ProductSwitcher } from "./ProductSwitcher";
import { ProductAnalytics } from "./ProductAnalytics";
import { CreativeControls } from "./CreativeExperience";

export function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mlynq = pathname.startsWith("/mlynq");
  const productPage = mlynq || pathname.startsWith("/mentron");
  return (
    <LoadingProvider>
      <MotionConfig reducedMotion="user">
        {!mlynq && (
          <>
            <SidebarWrapper />
            <LoadingOverlay />
            <NavigationInterceptor />
            <NavigationEventsWrapper />
          </>
        )}
        <ProductSwitcher />
        <ProductAnalytics />
        <CreativeControls />
        <div
          className={
            (mlynq ? "mlynq-surface" : "relative z-10 w-full") +
            (productPage ? " platform-product" : "") +
            (pathname.startsWith("/mentron/") ? " creative-workspace" : "") +
            ([
              "/signup",
              "/forgot-password",
              "/reset-password",
              "/join",
            ].includes(pathname)
              ? " creative-account creative-workspace"
              : "")
          }
        >
          {mlynq ? children : <PageTransition>{children}</PageTransition>}
        </div>
      </MotionConfig>
    </LoadingProvider>
  );
}

"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: ReactNode }) {
  // Keep the server and client tree identical. CSS handles the motion preference
  // without removing a wrapper during hydration.
  const pathname = usePathname();
  return (
    <div key={pathname} className="mentron-page-transition creative-page-enter">
      {children}
    </div>
  );
}

'use client'

import { ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  // Keep the server and client tree identical. CSS handles the motion preference
  // without removing a wrapper during hydration.
  return <div className="mentron-page-transition">{children}</div>
}

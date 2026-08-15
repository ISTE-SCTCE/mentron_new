'use client'

import { usePathname } from 'next/navigation'
import { GlassNav } from './GlassNav'

const PUBLIC_ROUTES = ['/login', '/signup', '/']

export function SidebarWrapper() {
    const pathname = usePathname()
    const isPublic = PUBLIC_ROUTES.some(route => pathname === route || pathname?.startsWith(route + '?'))
    if (isPublic) return null
    return <GlassNav />
}

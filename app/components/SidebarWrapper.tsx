'use client'
import { usePathname } from 'next/navigation'
import { GlassNav } from './GlassNav'
const PUBLIC_ROUTES = ['/login','/signup','/','/reset-password','/forgot-password','/join','/mentron','/mentron/privacy']
export function SidebarWrapper() {
    const pathname = usePathname()
    if(!pathname.startsWith('/mentron/') || PUBLIC_ROUTES.includes(pathname)) return null
    return <GlassNav/>
}

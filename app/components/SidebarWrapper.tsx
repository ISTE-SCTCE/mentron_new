'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

const PUBLIC_ROUTES = ['/login', '/signup', '/', '/forgot-password', '/reset-password']

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isPublic = PUBLIC_ROUTES.some(route => pathname === route || pathname?.startsWith(route + '?'))
    
    if (isPublic) return <>{children}</>

    return (
        <div className="flex min-h-screen w-full">
            <div className="hidden lg:block shrink-0">
                <Sidebar />
            </div>
            <main className="flex-1 flex flex-col min-h-screen w-full relative z-10 lg:pl-28">
                <div className="flex-1 shrink-0 px-4 md:px-8 pb-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}


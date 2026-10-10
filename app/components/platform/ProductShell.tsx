'use client'
import { usePathname } from 'next/navigation'
import LiquidBackground from '../LiquidBackground'
import { SidebarWrapper } from '../SidebarWrapper'
import { LoadingOverlay } from '../LoadingOverlay'
import { NavigationInterceptor } from '../NavigationInterceptor'
import { NavigationEventsWrapper } from '../NavigationEventsWrapper'
import { PageTransition } from '../motion/PageTransition'
import { LoadingProvider } from '@/app/lib/context/LoadingContext'
import { ProductSwitcher } from './ProductSwitcher'
import { ProductAnalytics } from './ProductAnalytics'

export function ProductShell({children}: {children: React.ReactNode}) {
    const pathname = usePathname()
    const mlynq = pathname.startsWith('/mlynq')
    return <LoadingProvider>
        {!mlynq && <><LiquidBackground/><SidebarWrapper/><LoadingOverlay/>
            <NavigationInterceptor/><NavigationEventsWrapper/></>}
        <ProductSwitcher/><ProductAnalytics/>
        <div className={mlynq ? 'mlynq-surface platform-product' : 'relative z-10 w-full platform-product'}>
            {mlynq ? children : <PageTransition>{children}</PageTransition>}
        </div>
    </LoadingProvider>
}

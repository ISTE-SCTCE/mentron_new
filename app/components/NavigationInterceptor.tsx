'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLoading } from '@/app/lib/context/LoadingContext'

/**
 * Intercepts all anchor-tag clicks that point to internal routes
 * and calls startLoading(href) immediately, before Next.js begins navigation.
 * stopLoading() is called by NavigationEvents once the new pathname registers.
 */
export function NavigationInterceptor() {
    const { startLoading } = useLoading()
    const pathname = usePathname()
    // We need searchParams to check for the full URL
    const currentFullUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a')
            if (!target) return

            const href = target.getAttribute('href')
            if (!href) return

            // Only fire for internal links (not mailto:, tel:, external URLs, anchors)
            const isInternal =
                href.startsWith('/') &&
                !href.startsWith('//') &&
                !target.getAttribute('target')

            // Don't trigger if modifier keys held (open-in-new-tab)
            const isModified = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey

            if (isInternal && !isModified) {
                if (href === currentFullUrl) {
                    return // user clicked a link to current full URL, no nav will occur
                }

                startLoading(href)  // pass the href so overlay can be route-specific
            }
        }

        document.addEventListener('click', handleClick, { capture: true })
        return () => document.removeEventListener('click', handleClick, { capture: true })
    }, [startLoading, pathname])

    return null
}

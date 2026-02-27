'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLoading } from '@/app/lib/context/LoadingContext'

export function NavigationEvents() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { startLoading, stopLoading } = useLoading()

    // Track previous path so we only show on actual navigation changes
    const prevPathRef = useRef<string | null>(null)
    const isFirstRender = useRef(true)

    useEffect(() => {
        const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

        if (isFirstRender.current) {
            isFirstRender.current = false
            prevPathRef.current = currentPath
            return
        }

        if (prevPathRef.current !== currentPath) {
            prevPathRef.current = currentPath
            stopLoading()
        }
    }, [pathname, searchParams, stopLoading])

    return null
}

// Hook to use when manually triggering navigation with loading.
// Usage: const navigate = useNavigateWithLoading()
//        navigate(() => router.push('/some-route'))
export function useNavigateWithLoading() {
    const { startLoading } = useLoading()

    return (navigateFn: () => void) => {
        startLoading()
        navigateFn()
    }
}

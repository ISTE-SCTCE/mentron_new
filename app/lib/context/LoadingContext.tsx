'use client'

import React, { createContext, useCallback, useContext, useRef, useState } from 'react'

interface LoadingContextValue {
    isLoading: boolean
    destination: string | null
    startLoading: (href?: string) => void
    stopLoading: () => void
}

const LoadingContext = createContext<LoadingContextValue>({
    isLoading: false,
    destination: null,
    startLoading: () => { },
    stopLoading: () => { },
})

const MIN_VISIBLE_MS = 400

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false)
    const [destination, setDestination] = useState<string | null>(null)
    const startTimeRef = useRef<number | null>(null)
    const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const startLoading = useCallback((href?: string) => {
        if (stopTimerRef.current) {
            clearTimeout(stopTimerRef.current)
            stopTimerRef.current = null
        }
        startTimeRef.current = Date.now()
        setDestination(href ?? null)
        setIsLoading(true)
    }, [])

    const stopLoading = useCallback(() => {
        const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : MIN_VISIBLE_MS
        const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed)

        stopTimerRef.current = setTimeout(() => {
            setIsLoading(false)
            setDestination(null)
            startTimeRef.current = null
        }, remaining)
    }, [])

    return (
        <LoadingContext.Provider value={{ isLoading, destination, startLoading, stopLoading }}>
            {children}
        </LoadingContext.Provider>
    )
}

export function useLoading() {
    return useContext(LoadingContext)
}

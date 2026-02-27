import { Suspense } from 'react'
import { NavigationEvents } from './NavigationEvents'

/**
 * Suspense boundary required because NavigationEvents uses useSearchParams.
 * This is a server component wrapper so it can be imported directly in layout.tsx.
 */
export function NavigationEventsWrapper() {
    return (
        <Suspense fallback={null}>
            <NavigationEvents />
        </Suspense>
    )
}

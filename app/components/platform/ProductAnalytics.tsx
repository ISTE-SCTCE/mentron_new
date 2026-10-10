'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { getPlatformClient } from '@/app/lib/platform/browser'
import { routeTemplate } from '@/app/lib/platform/access.mjs'
export function ProductAnalytics() {
    const pathname = usePathname()
    const previous = useRef('')
    useEffect(() => {
        if(previous.current === pathname) return
        previous.current = pathname
        const product = pathname.startsWith('/mlynq') ? 'mlynq' : pathname.startsWith('/mentron') ? 'mentron' : null
        if(!product) return
        const client = getPlatformClient()
        // Record route templates, never search strings or content/user IDs.
        const route = routeTemplate(pathname)
        client.auth.getUser().then(async ({data: {user}}) => {
            if(user) await client.from('analytics_events').insert({
                profile_id:user.id, product, event_name:'page_view', properties:{route,client:'web'}
            })
        }).catch(() => {})
    }, [pathname])
    return null
}

'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {Compass, Layers3} from 'lucide-react'
import { getPlatformClient } from '@/app/lib/platform/browser'
import { productHome, type Product } from '@/app/lib/platform/config'
import { canOpenProduct, isActiveProfile } from '@/app/lib/platform/access.mjs'

export function ProductSwitcher() {
    const pathname = usePathname()
    const current: Product = pathname.startsWith('/mlynq') ? 'mlynq' : 'mentron'
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [signedIn, setSignedIn] = useState(false)
    useEffect(() => {
        const client = getPlatformClient()
        let mounted = true
        client.auth.getSession().then(({data}) => { if(mounted) setSignedIn(!!data.session) })
        const {data} = client.auth.onAuthStateChange((_event, session) => {
            if(mounted) setSignedIn(!!session)
        })
        return () => { mounted = false; data.subscription.unsubscribe() }
    }, [])
    async function switchTo(product: Product) {
        if(product === current || busy) return
        setError('')
        if(!signedIn) { window.location.assign('/' + product); return }
        setBusy(true)
        try {
            const client = getPlatformClient()
            const {data: {user}, error: authError} = await client.auth.getUser()
            if(authError || !user) throw new Error('Please sign in again.')
            const {data: profile, error: profileError} = await client.from('profiles')
                .select('status,suspended_until,is_mlynq_user,is_mentron_user').eq('id',user.id).single()
            if(profileError || !isActiveProfile(profile)) throw new Error('Your account is unavailable.')
            if(!canOpenProduct(profile,product)) {
                window.location.assign('/join?product=' + product)
                return
            }
            await client.from('analytics_events').insert({
                profile_id: user.id, product, event_name: 'product_switch', properties: {from:current}
            })
            window.location.assign(productHome(product))
        } catch(e) { setError(e instanceof Error ? e.message : 'Could not switch product.'); setBusy(false) }
    }
    if(!pathname.startsWith('/mlynq') && !pathname.startsWith('/mentron')) return null
    return <div className="platform-switcher" aria-label="Switch product">
        <div role="group" aria-label="Products">
            {(['mlynq','mentron'] as Product[]).map(product =>
                <button type="button" key={product} aria-pressed={current===product}
                    disabled={busy} onClick={() => switchTo(product)}>
                    <span aria-hidden="true">{product==='mlynq' ? <Compass size={16}/> : <Layers3 size={16}/>}</span>
                    {product==='mlynq' ? 'Mlynq' : 'Mentron'}
                </button>)}
        </div>
        {error && <p role="alert">{error}</p>}
    </div>
}

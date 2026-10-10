import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { PLATFORM_URL, PLATFORM_PUBLISHABLE_KEY, productHome } from '../platform/config'
import { canOpenProduct, isActiveProfile } from '../platform/access.mjs'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({request})
    const client = createServerClient(PLATFORM_URL,PLATFORM_PUBLISHABLE_KEY,{
        cookies:{
            getAll:() => request.cookies.getAll(),
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({name,value}) => request.cookies.set(name,value))
                response = NextResponse.next({request})
                cookiesToSet.forEach(({name,value,options}) => response.cookies.set(name,value,options))
            }
        }
    })
    const {data:{user}} = await client.auth.getUser()
    const path = request.nextUrl.pathname.replace(/\/$/,'')
    const loginProduct = path === '/mlynq/login' ? 'mlynq' : path === '/login'
        ? (request.nextUrl.searchParams.get('product') === 'mlynq' ? 'mlynq' : 'mentron') : null
    const product = path.startsWith('/mlynq/') ? 'mlynq' : path.startsWith('/mentron/') ? 'mentron' : null
    const isProtected = product && !['/mlynq/login','/mentron/privacy'].includes(path)
    function go(destination: string) {
        const url = new URL(destination,request.url)
        const redirect = NextResponse.redirect(url)
        response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie))
        return redirect
    }
    if(isProtected && !user) return go('/login?product=' + product)
    // Product login methods differ; a verified active session is shared.
    if(user && loginProduct) {
        const {data:profile,error} = await client.from('profiles')
            .select('status,suspended_until,is_mlynq_user,is_mentron_user').eq('id',user.id).maybeSingle()
        if(!error && isActiveProfile(profile)) return go(canOpenProduct(profile,loginProduct)
            ? productHome(loginProduct) : '/join?product='+loginProduct)
    }
    if(isProtected && user && product) {
        const {data:profile,error} = await client.from('profiles')
            .select('status,suspended_until,is_mlynq_user,is_mentron_user,role,permissions')
            .eq('id',user.id).maybeSingle()
        if(error || !isActiveProfile(profile)) {
            return go('/login?error=' + encodeURIComponent('Your account is unavailable. Please contact ISTE.'))
        }
        if(!canOpenProduct(profile,product)) return go('/join?product='+product)
        if(product==='mentron' && (path.startsWith('/mentron/admin') || path.startsWith('/mentron/core') || path.startsWith('/mentron/analytics'))) {
            const {data:allowed} = await client.schema('mentron').rpc('is_execom')
            if(!allowed) return go(productHome(product))
        }
        if(path.startsWith('/mentron/notes/upload')) {
            const {data:allowed} = await client.schema('mentron').rpc('is_execom')
            if(!allowed || profile?.permissions?.can_upload_notes===false) return go('/mentron/notes')
        }
    }
    return response
}

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected routes logic
    const isProtectedPath =
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname.startsWith('/notes') ||
        request.nextUrl.pathname.startsWith('/projects') ||
        request.nextUrl.pathname.startsWith('/marketplace') ||
        request.nextUrl.pathname.startsWith('/events')
    const isAdminPath = request.nextUrl.pathname.startsWith('/admin')

    if (isProtectedPath && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (isAdminPath && user) {
        // Check role for admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'exec' && profile?.role !== 'core') {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    // ── TWO-DEVICE SECURITY GATE ──
    if (user && isProtectedPath) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('current_session_id')
            .eq('id', user.id)
            .single()

        if (profile?.current_session_id) {
            const clientSid = request.cookies.get('mentron_sid')?.value

            if (!clientSid) {
                // HEAL: User is valid but cookie is missing (e.g. following a redirect)
                // We sync it now so the Dashboard/Page doesn't see a mismatch
                response.cookies.set('mentron_sid', profile.current_session_id, {
                    path: '/',
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7 // 1 week
                })
            } else if (clientSid !== profile.current_session_id) {
                // KICK: Cookie exists but doesn't match DB (Device B kicked Device A)
                
                // 1. Log out the user by clearing their Supabase session
                // We do this by creating a redirect response that clears the cookies
                const url = request.nextUrl.clone()
                url.pathname = '/login'
                url.searchParams.set('error', 'Logged in from another device')
                
                const redirectResponse = NextResponse.redirect(url)
                
                // Clear the mismatching side cookie
                redirectResponse.cookies.delete('mentron_sid')
                
                // NOTE: Supabase session is handled by the redirect to /login 
                // but we can also manually clear the cookie patterns if needed.
                // Redirecting to /login is the safest way to reset the state.
                return redirectResponse
            }
        }
    }

    return response
}

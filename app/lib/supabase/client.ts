import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ysllolnoyezfdllqocgv.supabase.co'
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_FwJxMntZ8Hiqze7RUK0gcQ_L_0DGAbs'
    return createBrowserClient(url, anonKey)
}

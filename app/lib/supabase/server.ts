import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { PLATFORM_URL, PLATFORM_PUBLISHABLE_KEY } from '../platform/config'
import { withMentronStorage } from '../platform/storage'

export async function createClient() {
    const cookieStore = await cookies()
    return withMentronStorage(createServerClient(PLATFORM_URL, PLATFORM_PUBLISHABLE_KEY, {
        db:{schema:'mentron'},
        cookies:{
            getAll:() => cookieStore.getAll(),
            setAll(cookiesToSet) {
                try { cookiesToSet.forEach(({name,value,options}) => cookieStore.set(name,value,options)) }
                catch { /* Middleware refreshes cookies for Server Components. */ }
            }
        }
    }))
}
export async function getAuthUser(request: NextRequest) {
    const header = request.headers.get('Authorization') ?? request.headers.get('x-supabase-auth')
    if(header?.startsWith('Bearer ')) {
        const token = header.slice(7)
        const client = withMentronStorage(createSupabaseClient(PLATFORM_URL, PLATFORM_PUBLISHABLE_KEY,{
            db:{schema:'mentron'},
            auth:{persistSession:false,autoRefreshToken:false},
            global:{headers:{Authorization:header}}
        }))
        const {data:{user},error} = await client.auth.getUser(token)
        return {user:error ? null : user,supabase:client}
    }
    const supabase = await createClient()
    const {data:{user},error} = await supabase.auth.getUser()
    return {user:error ? null : user,supabase}
}

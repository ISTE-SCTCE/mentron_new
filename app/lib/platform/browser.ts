'use client'
import { createBrowserClient } from '@supabase/ssr'
import { PLATFORM_URL, PLATFORM_PUBLISHABLE_KEY } from './config'
import type { SupabaseClient } from '@supabase/supabase-js'
let client: SupabaseClient | undefined
export function getPlatformClient(): SupabaseClient {
    client ??= createBrowserClient(PLATFORM_URL, PLATFORM_PUBLISHABLE_KEY)
    return client
}

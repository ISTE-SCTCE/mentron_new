'use client'
import { getPlatformClient } from '../platform/browser'
import type { SupabaseClient } from '@supabase/supabase-js'
import { mentronStorage } from '../platform/storage'
let mentronClient: SupabaseClient | undefined
// Product queries are namespaced; Auth and cookies belong to the single platform client.
export function createClient(): SupabaseClient {
    if (!mentronClient) {
        const shared = getPlatformClient()
        const storage = mentronStorage(shared)
        mentronClient = new Proxy(shared, {
            get(target, property) {
                if (property === 'storage') return storage
                if (property === 'from') return target.schema('mentron').from.bind(target.schema('mentron'))
                if (property === 'rpc') return target.schema('mentron').rpc.bind(target.schema('mentron'))
                const value = Reflect.get(target, property)
                return typeof value === 'function' ? value.bind(target) : value
            }
        })
    }
    return mentronClient
}

import type {SupabaseClient} from '@supabase/supabase-js'
export const MENTRON_BUCKETS = ['project bucket','profile-photos','marketplace-images','marketplace-payment-proofs','marketplace-qr','cv_bucket','notes_bucket','marketplace_bucket','academy-lectures'] as const
export function mentronBucket(bucket:string) {
    const name=bucket.startsWith('mentron-')?bucket.slice(8):bucket
    if(!(MENTRON_BUCKETS as readonly string[]).includes(name)) throw new Error('Unsupported Mentron storage bucket')
    return 'mentron-'+name
}
type StorageOwner = {storage:SupabaseClient['storage']}
export function mentronStorage(client:StorageOwner) {
    return new Proxy(client.storage,{
        get(target,property) {
            if(property==='from') return (bucket:string)=>target.from(mentronBucket(bucket))
            const value=Reflect.get(target,property)
            return typeof value==='function'?value.bind(target):value
        }
    })
}
export function withMentronStorage<T extends StorageOwner>(client:T):T {
    const storage=mentronStorage(client)
    return new Proxy(client,{get(target,property) {
        if(property==='storage') return storage
        const value=Reflect.get(target,property)
        return typeof value==='function'?value.bind(target):value
    }})
}

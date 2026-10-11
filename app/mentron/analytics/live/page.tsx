import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LiveProductAnalytics } from '@/app/components/platform/LiveProductAnalytics'
export default async function LiveAnalyticsPage() {
    const client = await createClient()
    const {data:{user}} = await client.auth.getUser()
    if(!user) redirect('/login')
    const {data: allowed} = await client.schema('mentron').rpc('is_execom')
    if(!allowed) redirect('/mentron/dashboard')
    return <main className="mx-auto max-w-5xl px-6 pb-12 pt-36"><h1 className="text-3xl font-bold">Live product activity</h1>
        <p className="mt-3 text-gray-300">Mlynq and Mentron activity over the last seven days.</p><LiveProductAnalytics/></main>
}

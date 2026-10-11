'use client'
import { useEffect, useState } from 'react'
import { getPlatformClient } from '@/app/lib/platform/browser'
type Row = {product:string,event_name:string,events:number,users:number}
export function LiveProductAnalytics() {
    const [rows,setRows] = useState<Row[]>([])
    const [error,setError] = useState('')
    const [updated,setUpdated] = useState('')
    useEffect(() => {
        const client = getPlatformClient()
        let mounted = true
        let pending: ReturnType<typeof setTimeout> | undefined
        async function refresh() {
            const {data,error} = await client.rpc('product_analytics_summary',{p_days:7})
            if(!mounted) return
            if(error) { setError('Activity could not be loaded.'); return }
            setError(''); setRows(data??[]); setUpdated(new Date().toLocaleTimeString())
        }
        const channel = client.channel('product-activity')
            .on('postgres_changes',{event:'INSERT',schema:'public',table:'analytics_events'},() => {
                clearTimeout(pending); pending = setTimeout(refresh,500)
            }).subscribe()
        refresh()
        const interval = setInterval(refresh,30000)
        return () => { mounted=false; clearTimeout(pending); clearInterval(interval); client.removeChannel(channel) }
    },[])
    return <section className="mt-8 space-y-4" aria-live="polite">
        {error && <p role="alert">{error}</p>}
        <p className="text-sm text-gray-400">{updated ? 'Updated '+updated : 'Loading activity…'}</p>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left"><thead><tr className="bg-white/5">
                {['Product','Activity','Events','People'].map(label => <th key={label} className="p-4">{label}</th>)}
            </tr></thead><tbody>{rows.map(row => <tr key={row.product+row.event_name} className="border-t border-white/10">
                <td className="p-4">{row.product==='mlynq'?'Mlynq':'Mentron'}</td><td className="p-4">{row.event_name.replaceAll('_',' ')}</td>
                <td className="p-4">{row.events}</td><td className="p-4">{row.users}</td>
            </tr>)}</tbody></table>
        </div>{updated && !rows.length && <p>No activity recorded in this period.</p>}
    </section>
}

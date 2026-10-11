'use client'
import dynamic from 'next/dynamic'
const Mlynq = dynamic(() => import('@/products/mlynq/App'), {
    ssr:false, loading:() => <div className="p-12 text-center">Opening Mlynq…</div>
})
export default function MlynqPage() { return <Mlynq/> }

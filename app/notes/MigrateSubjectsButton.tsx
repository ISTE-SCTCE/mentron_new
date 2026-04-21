'use client'

import { useState } from 'react'

export function MigrateSubjectsButton() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    async function handleMigrate() {
        if (!confirm('This will sync all hardcoded subjects into your database. Continue?')) return
        
        setStatus('loading')
        try {
            const res = await fetch('/api/admin/migrate-subjects')
            const data = await res.json()
            
            if (res.ok) {
                setStatus('success')
                setMessage(`Successfully synced ${data.inserted} subjects!`)
                // Refresh after success to show new subjects
                setTimeout(() => window.location.reload(), 2000)
            } else {
                setStatus('error')
                setMessage(data.error || 'Sync failed')
            }
        } catch (err: any) {
            setStatus('error')
            setMessage(err.message)
        }
    }

    return (
        <div className="mb-8">
            <button
                onClick={handleMigrate}
                disabled={status === 'loading'}
                className={`glass px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 border 
                    ${status === 'success' ? 'border-green-500/50 text-green-400 bg-green-500/5' : 
                      status === 'error' ? 'border-red-500/50 text-red-400 bg-red-500/5' : 
                      'border-amber-500/30 text-amber-400 hover:border-amber-500/60 bg-amber-500/5'}`}
            >
                <span className="text-xl">
                    {status === 'loading' ? '⏳' : status === 'success' ? '✅' : status === 'error' ? '❌' : '🔄'}
                </span>
                {status === 'loading' ? 'Syncing Subjects...' : 
                 status === 'success' ? 'Sync Complete!' : 
                 status === 'error' ? 'Sync Failed' : 
                 'Sync Legacy Subjects to DB'}
            </button>
            
            {message && (
                <p className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                    {message}
                </p>
            )}
        </div>
    )
}

'use client'

import React from 'react'

interface ProfileCardProps {
    displayName: string
    displayRole: string
    displayDept: string
    displayRoll: string
    displayYear: string
    className?: string
}

export function ProfileCard({
    displayName,
    displayRole,
    displayDept,
    displayRoll,
    displayYear,
    className = "",
}: ProfileCardProps) {
    return (
        <div className={`glass-card flex h-full flex-col justify-between ${className}`}>
            <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-[#5d22d7] text-3xl font-black uppercase text-white shadow-[0_16px_32px_rgba(93,34,215,0.24)]">
                    {displayName?.[0] || 'M'}
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff8a24]">Learner profile</p>
                    <h2 className="mt-1 truncate text-2xl font-black text-[#241653]">{displayName}</h2>
                    <p className="text-sm font-bold uppercase tracking-widest text-[#8a80aa]">{displayRole}</p>
                </div>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-3">
                {[
                    ['Dept', displayDept],
                    ['Roll', displayRoll],
                    ['Year', displayYear],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-[#f7f3ff] p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8a80aa]">{label}</p>
                        <p className="mt-1 truncate text-sm font-black text-[#241653]">{value}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

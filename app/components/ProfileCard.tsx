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
    className = ""
}: ProfileCardProps) {
    return (
        <div className={`glass-card flex flex-col items-center justify-center text-center space-y-6 ${className}`}>
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-[#030303] flex items-center justify-center text-4xl font-black uppercase">
                        {displayName[0]}
                    </div>
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white">{displayName}</h1>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">{displayRole}</p>
                </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5 w-full">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Dept</span>
                    <span className="text-white font-black">{displayDept}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Roll</span>
                    <span className="text-white font-black uppercase">{displayRoll}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Year</span>
                    <span className="text-white font-black">{displayYear}</span>
                </div>
            </div>
        </div>
    )
}

'use client'

import { logInteraction } from '@/app/lib/actions/analytics'
import { useEffect } from 'react'

interface TrackerProps {
    itemType: 'note' | 'marketplace_item' | 'project'
    itemId: string
    interactionType: 'view' | 'download'
    trigger?: 'mount' | 'click'
    children: React.ReactNode
}

export function InteractionTracker({ itemType, itemId, interactionType, trigger = 'click', children }: TrackerProps) {
    useEffect(() => {
        if (trigger === 'mount') {
            logInteraction(itemType, itemId, interactionType)
        }
    }, [itemType, itemId, interactionType, trigger])

    const handleClick = () => {
        if (trigger === 'click') {
            logInteraction(itemType, itemId, interactionType)
        }
    }

    return (
        <div onClick={handleClick} className="contents">
            {children}
        </div>
    )
}

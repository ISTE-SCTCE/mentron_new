'use client'

import { useState } from 'react'

interface DeleteButtonProps {
    onDelete: () => Promise<{ error?: string, success?: boolean }>
    itemName?: string
}

export function DeleteButton({ onDelete, itemName = 'item' }: DeleteButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!window.confirm(`Are you sure you want to delete this ${itemName}? This action cannot be undone.`)) {
            return
        }

        setIsDeleting(true)
        try {
            const result = await onDelete()
            if (result?.error) {
                alert(`Error deleting ${itemName}: ${result.error}`)
            }
        } catch (error) {
            console.error("Delete failed", error)
            alert(`Unexpected error deleting ${itemName}.`)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 p-2 px-3 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-400 bg-white/5 border border-red-500/20 uppercase tracking-widest text-[9px] font-black transition-all shrink-0 disabled:opacity-50"
            title="Delete"
        >
            {isDeleting ? '...' : '🗑️ Delete'}
        </button>
    )
}

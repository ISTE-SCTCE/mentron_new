'use client'

import { createMarketplaceItem } from '../actions'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function NewMarketplaceItemPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] p-8">
            <div className="max-w-2xl mx-auto">
                <header className="flex items-center gap-4 mb-12">
                    <Link href="/marketplace" className="text-gray-400 hover:text-white transition-all">
                        ← Back to Marketplace
                    </Link>
                    <h1 className="text-4xl font-bold tracking-tight text-white">Sell an Item</h1>
                </header>

                <div className="bg-[#171717] p-8 rounded-2xl border border-white/10 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <form action={createMarketplaceItem} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Item Title</label>
                                <input
                                    name="title"
                                    type="text"
                                    placeholder="e.g., Engineering Mathematics Textbook"
                                    required
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Describe the item's condition, age, etc."
                                    rows={4}
                                    required
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Price (₹)</label>
                                <input
                                    name="price"
                                    type="number"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    required
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Item Image</label>
                                <input
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    required
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-4 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transform active:scale-[0.98] transition-all text-lg"
                        >
                            Post Listing
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

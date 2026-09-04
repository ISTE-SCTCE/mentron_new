'use client'

import { createMarketplaceItem } from '../actions'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MarketplaceTheme } from '../theme'

export default function NewMarketplaceItemPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    return (
        <div className="min-h-screen text-[#ededed] pt-20 sm:pt-28 md:pt-32 p-4 sm:p-6 md:p-8">
            <div className="max-w-2xl mx-auto">
                <header className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 sm:mb-12">
                    <Link href="/marketplace" className="text-gray-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest inline-flex items-center gap-1.5 group">
                        <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Back to Marketplace
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Sell an Item</h1>
                </header>

                <div className="glass-card p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] border-white/10 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 text-xs font-bold text-red-400 glass border-red-500/20 rounded-2xl text-center bg-red-500/5">
                            {error}
                        </div>
                    )}

                    <form action={createMarketplaceItem} className="space-y-6">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Item Title</label>
                                <input
                                    name="title"
                                    type="text"
                                    placeholder="e.g., Engineering Mathematics Textbook"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium text-sm sm:text-base"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                                    <select
                                        name="category"
                                        defaultValue="other"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium text-sm sm:text-base"
                                    >
                                        <option value="textbook" className="bg-[#1a192e] text-white">Textbook</option>
                                        <option value="electronics" className="bg-[#1a192e] text-white">Electronics</option>
                                        <option value="project_components" className="bg-[#1a192e] text-white">Project Components</option>
                                        <option value="stationery" className="bg-[#1a192e] text-white">Stationery</option>
                                        <option value="other" className="bg-[#1a192e] text-white">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Condition</label>
                                    <select
                                        name="condition"
                                        defaultValue="used"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium text-sm sm:text-base"
                                    >
                                        <option value="new" className="bg-[#1a192e] text-white">New</option>
                                        <option value="like_new" className="bg-[#1a192e] text-white">Like New</option>
                                        <option value="used" className="bg-[#1a192e] text-white">Used</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Describe the item's condition, age, edition, etc."
                                    rows={4}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm sm:text-base resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Price (₹)</label>
                                <input
                                    name="price"
                                    type="number"
                                    placeholder="0"
                                    step="1"
                                    min="0"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono text-sm sm:text-base"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Item Image</label>
                                <input
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-xs sm:text-sm text-gray-400 file:mr-4 file:py-2 file:px-5 file:rounded-full file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:text-white transition-all cursor-pointer"
                                    style={{
                                        // Use hero gradient for upload pill
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full mt-6 text-white font-black py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-xs sm:text-sm uppercase tracking-widest cursor-pointer"
                            style={{ background: MarketplaceTheme.heroGradient }}
                        >
                            Post Listing
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

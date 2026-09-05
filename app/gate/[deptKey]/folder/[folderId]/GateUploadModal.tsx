'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileUp, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { saveGateNoteMetadata } from '@/app/gate/actions'

interface Props {
    isOpen: boolean
    onClose: () => void
    folderId: string
    folderName: string
    deptKey: string
    onNoteUploaded: (note: any) => void
}

export function GateUploadModal({
    isOpen,
    onClose,
    folderId,
    folderName,
    deptKey,
    onNoteUploaded,
}: Props) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadStage, setUploadStage] = useState<'idle' | 'preparing' | 'uploading' | 'saving' | 'done'>('idle')
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setSelectedFile(file)
            if (!title) {
                // Auto-fill title from filename without extension
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
                setTitle(nameWithoutExt.replace(/[_-]/g, ' '))
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedFile) {
            setError('Please select a file to upload.')
            return
        }
        if (!title.trim()) {
            setError('Note title is required.')
            return
        }

        setError(null)
        setUploadProgress(0)

        try {
            // ── STEP 1: Presigned URL from R2 ──
            setUploadStage('preparing')
            const presignedRes = await fetch('/api/upload/presigned', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: selectedFile.name,
                    fileType: selectedFile.type || 'application/octet-stream',
                    bucketFolder: 'notes_bucket',
                }),
            })

            if (!presignedRes.ok) {
                const errData = await presignedRes.json()
                throw new Error(errData.error || 'Failed to prepare upload.')
            }

            const { url, key } = await presignedRes.json()

            // ── STEP 2: Upload Direct to Storage via XHR with Progress ──
            setUploadStage('uploading')
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhr.open('PUT', url)
                xhr.setRequestHeader('Content-Type', selectedFile.type || 'application/octet-stream')

                xhr.upload.onprogress = (evt) => {
                    if (evt.lengthComputable) {
                        const percent = Math.round((evt.loaded / evt.total) * 100)
                        setUploadProgress(percent)
                    }
                }

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) resolve(true)
                    else reject(new Error('Storage upload failed with status ' + xhr.status))
                }

                xhr.onerror = () => reject(new Error('Network error during storage upload.'))
                xhr.send(selectedFile)
            })

            // ── STEP 3: Save Metadata to gate_notes ──
            setUploadStage('saving')
            const metaRes = await saveGateNoteMetadata({
                folderId,
                title: title.trim(),
                description: description.trim() || undefined,
                fileKey: key,
            })

            if (metaRes.error) {
                throw new Error(metaRes.error)
            }

            setUploadStage('done')
            if (metaRes.note) {
                onNoteUploaded(metaRes.note)
            }

            setTimeout(() => {
                onClose()
            }, 800)
        } catch (err: any) {
            setError(err.message || 'An error occurred during upload.')
            setUploadStage('idle')
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg glass-card border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <FileUp size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">Upload Notes</h3>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    {deptKey} / {folderName}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={uploadStage !== 'idle' && uploadStage !== 'done'}
                            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* File selector box */}
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
                            />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                                    selectedFile
                                        ? 'border-cyan-500/40 bg-cyan-500/5'
                                        : 'border-white/10 hover:border-white/20 bg-white/5'
                                }`}
                            >
                                {selectedFile ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <FileText size={24} className="text-cyan-400 shrink-0" />
                                        <div className="text-left overflow-hidden">
                                            <p className="text-sm font-bold text-white truncate">{selectedFile.name}</p>
                                            <p className="text-[10px] text-gray-400">
                                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload size={28} className="mx-auto text-gray-400" />
                                        <p className="text-xs font-bold text-gray-300">Click to select PDF or notes file</p>
                                        <p className="text-[10px] text-gray-500">PDF, PPTX, DOCX, ZIP, or images</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Title input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300">Note Title</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Unit 1 Complete Handwritten Notes"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                            />
                        </div>

                        {/* Description input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300">Description (Optional)</label>
                            <textarea
                                rows={2}
                                placeholder="Brief overview of the material covered..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                            />
                        </div>

                        {/* Progress display */}
                        {uploadStage !== 'idle' && (
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-[11px] font-mono text-gray-400">
                                    <span className="capitalize">{uploadStage}...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-400"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        transition={{ ease: 'easeOut' }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="pt-3 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={uploadStage !== 'idle' && uploadStage !== 'done'}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-all disabled:opacity-30"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={uploadStage !== 'idle' || !selectedFile}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(0,198,255,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {uploadStage === 'done' ? (
                                    <>
                                        <CheckCircle size={16} />
                                        Published!
                                    </>
                                ) : uploadStage !== 'idle' ? (
                                    'Uploading...'
                                ) : (
                                    'Upload Note'
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

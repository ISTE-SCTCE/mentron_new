'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/app/lib/supabase/client'

interface Props {
    projectId: string
    projectTitle: string
    cvRequired?: boolean
    userName: string
    userEmail: string
    onClose: () => void
    onSuccess: () => void
}

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_SIZE_MB = 5

export function ApplyModal({ projectId, projectTitle, cvRequired = true, userName, userEmail, onClose, onSuccess }: Props) {
    const [name, setName] = useState(userName)
    const [message, setMessage] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [fileError, setFileError] = useState('')
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploading, setUploading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const fileRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const chosen = e.target.files?.[0]
        setFileError('')
        setFile(null)
        if (!chosen) return

        if (!ALLOWED_TYPES.includes(chosen.type)) {
            setFileError('Only PDF or DOCX files are accepted.')
            return
        }
        if (chosen.size > MAX_SIZE_MB * 1024 * 1024) {
            setFileError(`File must be under ${MAX_SIZE_MB}MB.`)
            return
        }
        setFile(chosen)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (cvRequired && !file) { setFileError('Please upload your CV.'); return }
        setError('')
        setUploading(true)
        setUploadProgress(0)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('You must be signed in to apply.'); setUploading(false); return }

        // Self-heal: ensure profile row exists (prevents FK violation on applicant_id)
        const meta = user.user_metadata
        const { error: profileErr } = await supabase.from('profiles').upsert({
            id: user.id,
            full_name: name.trim() || meta?.full_name || 'Anonymous',
            roll_number: meta?.roll_number || `TEMP-${user.id.slice(0, 8)}`,
            department: meta?.department || 'Other',
            year: parseInt(String(meta?.year ?? '0').replace(/\D/g, '')) || 0,
            role: meta?.role || 'member',
        }, { onConflict: 'id', ignoreDuplicates: true })

        if (profileErr) {
            setError(`Profile sync failed: ${profileErr.message}`)
            setUploading(false)
            return
        }

        let finalCvUrl = null

        if (file) {
            // Simulate progress during upload
            const progressInterval = setInterval(() => {
                setUploadProgress(p => Math.min(p + 10, 85))
            }, 150)

            const filePath = `${user.id}/${projectId}/cv.${file.name.split('.').pop()}`
            const { error: uploadErr } = await supabase.storage
                .from('cv_bucket')
                .upload(filePath, file, { upsert: true })

            clearInterval(progressInterval)

            if (uploadErr) {
                setError(`Upload failed: ${uploadErr.message}`)
                setUploading(false)
                setUploadProgress(0)
                return
            }

            setUploadProgress(100)
            const { data: { publicUrl } } = supabase.storage
                .from('cv_bucket')
                .getPublicUrl(filePath)
            
            finalCvUrl = publicUrl
        }

        setUploading(false)
        setSubmitting(true)

        const { error: insertErr } = await supabase
            .from('project_applications')
            .insert({
                project_id: projectId,
                profile_id: user.id,
                cv_url: finalCvUrl,
                message: message.trim(),
            })

        setSubmitting(false)

        if (insertErr) {
            if (insertErr.code === '23505') {
                setError('You have already applied to this project.')
            } else {
                setError(`Submission failed: ${insertErr.message}`)
            }
            return
        }

        onSuccess()
    }

    const isUploadDone = uploadProgress === 100 && !uploading && file
    const canSubmit = (!cvRequired || file) && !fileError && !uploading && !submitting

    return (
        <div className="fixed inset-0 z-[9998] flex items-start justify-center p-4 pt-12 md:pt-32 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg glass rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase mb-1">Internship</p>
                        <h2 className="text-2xl font-black text-white leading-tight">Apply for</h2>
                        <h3 className="text-lg font-black text-blue-400 leading-tight">{projectTitle}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl glass bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Applicant Name */}
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="w-full glass bg-white/5 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>

                    {/* Email (read-only) */}
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={userEmail}
                            readOnly
                            className="w-full glass bg-white/5 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    {/* Cover Message */}
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                            Cover Note
                        </label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Briefly tell them why you're a great fit..."
                            rows={3}
                            className="w-full glass bg-white/5 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                        />
                    </div>

                    {/* CV Upload */}
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                            CV / Resume <span className="text-gray-600 normal-case">{cvRequired ? '(PDF or DOCX · max 5MB)' : '(Optional)'}</span>
                        </label>
                        <div
                            className="relative border border-dashed border-white/10 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-all"
                            onClick={() => fileRef.current?.click()}
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {file ? (
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-2xl">📄</span>
                                    <div className="text-left">
                                        <p className="text-sm font-black text-white">{file.name}</p>
                                        <p className="text-[10px] text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-3xl mb-2">☁️</p>
                                    <p className="text-sm font-bold text-gray-400">Click to upload your CV</p>
                                    <p className="text-[10px] text-gray-600 mt-1">PDF or DOCX · max 5MB</p>
                                </div>
                            )}
                        </div>
                        {fileError && (
                            <p className="text-red-400 text-xs font-bold mt-2">{fileError}</p>
                        )}
                    </div>

                    {/* Upload Progress */}
                    {(uploading || isUploadDone) && (
                        <div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                                <span className="text-gray-500">Upload Progress</span>
                                <span className={isUploadDone ? 'text-emerald-500' : 'text-blue-400'}>{uploadProgress}%</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-200 ${isUploadDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Global Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                            <p className="text-red-400 text-xs font-bold">{error}</p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className={`
                            w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all
                            ${canSubmit
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-[0.98]'
                                : 'bg-white/5 text-gray-600 cursor-not-allowed'
                            }
                        `}
                    >
                        {uploading ? 'Uploading CV…' : submitting ? 'Submitting…' : 'Submit Application'}
                    </button>
                </form>
            </div>
        </div>
    )
}

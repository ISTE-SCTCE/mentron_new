'use client'

import { useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { User, Lock, Bell, AlertTriangle } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

interface SettingsClientProps {
    profile: any
    userEmail: string
}

export function SettingsClient({ profile, userEmail }: SettingsClientProps) {
    const supabase = createClient()

    // Password Form State
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPasswords, setShowPasswords] = useState(false)
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

    // Notification State
    const [emailEnabled, setEmailEnabled] = useState(true)
    const [desktopEnabled, setDesktopEnabled] = useState(false)

    // Profile Edit State
    const [fullName, setFullName] = useState(profile?.full_name || '')
    const [departmentName, setDepartmentName] = useState(profile?.department || '')
    const [rollNumber, setRollNumber] = useState(profile?.roll_number || '')
    const [year, setYear] = useState(profile?.year?.toString() || '')
    const [isteId, setIsteId] = useState(profile?.iste_id || '')
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

    const handleUpdateProfile = async () => {
        setIsUpdatingProfile(true)
        try {
            // Optional: If ISTE ID is provided, we check it against Project A (via the local DB view/FDW)
            if (isteId && isteId !== profile?.iste_id) {
                const { data: member, error: memberError } = await supabase
                    .from('project_a.members')
                    .select('ui_id')
                    .eq('ui_id', isteId)
                    .maybeSingle()
                
                if (memberError || !member) {
                    toast.error("Invalid ISTE ID. Please check and try again.")
                    setIsUpdatingProfile(false)
                    return
                }
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    department: departmentName,
                    roll_number: rollNumber,
                    year: year ? parseInt(year) : null,
                    iste_id: isteId || null
                })
                .eq('id', profile?.id)
            if (error) throw error
            toast.success("Profile updated successfully!")
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile")
        } finally {
            setIsUpdatingProfile(false)
        }
    }

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword !== confirmPassword) {
            toast.error("New passwords do not match")
            return
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        setIsUpdatingPassword(true)
        try {
            if (!currentPassword) {
                throw new Error("Please enter your current password")
            }
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: userEmail,
                password: currentPassword
            })
            if (signInError) throw new Error("Incorrect current password")

            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })
            if (error) throw error

            toast.success("Password updated successfully!")
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            toast.error(error.message || "Failed to update password")
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    return (
        <div className="space-y-10 pb-16">
            <Toaster position="bottom-right" toastOptions={{
                style: { background: '#111827', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
            }} />

            {/* Profile Information Panel */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border-white/10">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <User className="text-cyan-400" size={20} />
                    <h2 className="text-lg sm:text-xl font-bold text-white">Profile Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
                        <input type="text" disabled value={userEmail}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-gray-400 opacity-80 cursor-not-allowed text-sm sm:text-base" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium text-sm sm:text-base" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Department Name</label>
                        <input type="text" value={departmentName} onChange={e => setDepartmentName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium text-sm sm:text-base" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Roll Number</label>
                        <input type="text" value={rollNumber} onChange={e => setRollNumber(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium text-sm sm:text-base" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Year</label>
                        <select value={year} onChange={e => setYear(e.target.value)}
                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm sm:text-base">
                            <option value="">Select Year</option>
                            <option value="1">Year 1</option>
                            <option value="2">Year 2</option>
                            <option value="3">Year 3</option>
                            <option value="4">Year 4</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Role</label>
                        <input type="text" disabled value={profile?.role || 'user'}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-gray-400 opacity-80 cursor-not-allowed capitalize text-sm sm:text-base" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ISTE ID (Optional)</label>
                        <input type="text" value={isteId} onChange={e => setIsteId(e.target.value)}
                            placeholder="Provide ISTE ID for notes access"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium text-sm sm:text-base" />
                    </div>
                </div>

                <div className="pt-6 sm:pt-8">
                    <button
                        disabled={isUpdatingProfile}
                        onClick={handleUpdateProfile}
                        className="w-full sm:w-auto relative group overflow-hidden rounded-2xl font-bold px-8 py-3.5 text-xs sm:text-sm uppercase tracking-wider transition-all focus:outline-none disabled:opacity-50 text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]">
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <User size={16} />
                            {isUpdatingProfile ? 'SAVING...' : 'SAVE CHANGES'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Change Password Panel */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border-white/10">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <Lock className="text-purple-400" size={20} />
                    <h2 className="text-lg sm:text-xl font-bold text-white">Change Password</h2>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2 max-w-xl">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Password</label>
                        <input type={showPasswords ? "text" : "password"}
                            placeholder="Enter your current password"
                            value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm sm:text-base" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Password</label>
                            <input type={showPasswords ? "text" : "password"}
                                placeholder="At least 6 characters"
                                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm sm:text-base" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confirm New Password</label>
                            <input type={showPasswords ? "text" : "password"}
                                placeholder="Re-enter new password"
                                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm sm:text-base" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="w-5 h-5 rounded-md flex items-center justify-center border border-white/20 bg-white/5">
                            {showPasswords && <div className="w-3 h-3 bg-cyan-400 rounded-sm" />}
                        </button>
                        <span className="text-xs text-gray-300 font-medium">Show passwords</span>
                    </div>

                    <div className="pt-2">
                        <button
                            disabled={isUpdatingPassword}
                            onClick={handleUpdatePassword}
                            className="w-full sm:w-auto relative group overflow-hidden rounded-2xl font-bold px-8 py-3.5 text-xs sm:text-sm uppercase tracking-wider transition-all focus:outline-none disabled:opacity-50 text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(112,0,223,0.3)] hover:scale-[1.02] active:scale-[0.98]">
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <Lock size={16} />
                                {isUpdatingPassword ? 'UPDATING...' : 'UPDATE PASSWORD'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Preferences Panel */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border-white/10">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <Bell className="text-cyan-400" size={20} />
                    <h2 className="text-lg sm:text-xl font-bold text-white">Notification Preferences</h2>
                </div>

                <div className="space-y-6 max-w-2xl">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-white mb-0.5">Email Notifications</h3>
                            <p className="text-xs text-gray-400">Receive email for announcements and updates</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setEmailEnabled(!emailEnabled)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 shrink-0 ${emailEnabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(0,198,255,0.4)]' : 'bg-white/10'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${emailEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="w-full h-[1px] bg-white/5" />

                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-white mb-0.5">Desktop Notifications</h3>
                            <p className="text-xs text-gray-400">Show browser push notifications</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDesktopEnabled(!desktopEnabled)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 shrink-0 ${desktopEnabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(0,198,255,0.4)]' : 'bg-white/10'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${desktopEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone Panel */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl box-border border-red-500/20 bg-red-500/5">
                <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="text-red-400" size={20} />
                    <h2 className="text-lg sm:text-xl font-bold text-red-400">Danger Zone</h2>
                </div>

                <p className="text-xs text-gray-400 mb-6">These actions are irreversible. Please be careful.</p>
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-[10px] font-black tracking-widest text-red-400 uppercase">
                    Account deletion is currently managed by system administrators.
                </div>
            </div>

        </div>
    )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { Eye, EyeOff, User, Lock, Bell, AlertTriangle, LogOut } from 'lucide-react'
import { logout } from '@/app/login/actions'
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
    const [departmentCode, setDepartmentCode] = useState(profile?.department_code || '')
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
                    department_code: departmentCode,
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
            <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-8">
                    <User className="text-cyan-400" size={20} />
                    <h2 className="text-xl font-bold text-white">Profile Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-400/80">Email</label>
                        <input type="text" disabled value={userEmail}
                            className="w-full glass bg-white/5 border-white/10 rounded-xl px-4 py-3 text-blue-300 opacity-80 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-400/80">Full Name</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                            className="w-full glass bg-white/5 border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-400/80">Department Code</label>
                        <input type="text" value={departmentCode} onChange={e => setDepartmentCode(e.target.value)}
                            className="w-full glass bg-white/5 border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-400/80">Roll Number</label>
                        <input type="text" value={rollNumber} onChange={e => setRollNumber(e.target.value)}
                            className="w-full glass bg-white/5 border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-400/80">Year</label>
                        <select value={year} onChange={e => setYear(e.target.value)}
                            className="w-full glass bg-[#0a0a0a] border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors">
                            <option value="">Select Year</option>
                            <option value="1">Year 1</option>
                            <option value="2">Year 2</option>
                            <option value="3">Year 3</option>
                            <option value="4">Year 4</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-400/80">Role</label>
                        <input type="text" disabled value={profile?.role || 'user'}
                            className="w-full glass bg-white/5 border-white/10 rounded-xl px-4 py-3 text-blue-300 opacity-80 cursor-not-allowed capitalize" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-400/80">ISTE ID (Optional)</label>
                        <input type="text" value={isteId} onChange={e => setIsteId(e.target.value)}
                            placeholder="Provide ISTE ID for notes access"
                            className="w-full glass bg-white/5 border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors" />
                    </div>
                </div>

                <div className="pt-8">
                    <button
                        disabled={isUpdatingProfile}
                        onClick={handleUpdateProfile}
                        className="relative group overflow-hidden rounded-full font-bold px-8 py-3 text-sm transition-all focus:outline-none disabled:opacity-50"
                        style={{ background: 'linear-gradient(90deg, #10B981, #059669)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
                        <span className="relative z-10 flex items-center gap-2">
                            <User size={16} />
                            {isUpdatingProfile ? 'SAVING...' : 'SAVE CHANGES'}
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                    </button>
                </div>
            </div>

            {/* Change Password Panel */}
            <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-8">
                    <Lock className="text-purple-400" size={20} />
                    <h2 className="text-xl font-bold text-white">Change Password</h2>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2 max-w-xl">
                        <label className="text-sm font-medium text-blue-400/80">Current Password</label>
                        <input type={showPasswords ? "text" : "password"}
                            placeholder="Enter your current password"
                            value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full glass bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-700" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-blue-400/80">New Password</label>
                            <input type={showPasswords ? "text" : "password"}
                                placeholder="At least 6 characters"
                                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full glass bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-700" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-blue-400/80">Confirm New Password</label>
                            <input type={showPasswords ? "text" : "password"}
                                placeholder="Re-enter new password"
                                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full glass bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-700" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button onClick={() => setShowPasswords(!showPasswords)} className="w-5 h-5 rounded flex items-center justify-center border border-white/20 bg-black/50">
                            {showPasswords && <div className="w-3 h-3 bg-cyan-400 rounded-sm" />}
                        </button>
                        <span className="text-sm text-blue-300">Show passwords</span>
                    </div>

                    <div className="pt-4">
                        <button
                            disabled={isUpdatingPassword}
                            onClick={handleUpdatePassword}
                            className="relative group overflow-hidden rounded-full font-bold px-8 py-3 text-sm transition-all focus:outline-none disabled:opacity-50"
                            style={{ background: 'linear-gradient(90deg, #00B4DB, #0083B0)', boxShadow: '0 0 20px rgba(0, 180, 219, 0.4)' }}>
                            <span className="relative z-10 flex items-center gap-2">
                                <Lock size={16} />
                                {isUpdatingPassword ? 'UPDATING...' : 'UPDATE PASSWORD'}
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Preferences Panel */}
            <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-8">
                    <Bell className="text-red-400" size={20} />
                    <h2 className="text-xl font-bold text-white">Notification Preferences</h2>
                </div>

                <div className="space-y-8 max-w-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white mb-1">Email Notifications</h3>
                            <p className="text-xs text-blue-400/60">Receive email for announcements and updates</p>
                        </div>
                        <button
                            onClick={() => setEmailEnabled(!emailEnabled)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${emailEnabled ? 'bg-cyan-500' : 'bg-white/10'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${emailEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="w-full h-[1px] bg-white/5" />

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white mb-1">Desktop Notifications</h3>
                            <p className="text-xs text-blue-400/60">Show browser push notifications</p>
                        </div>
                        <button
                            onClick={() => setDesktopEnabled(!desktopEnabled)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${desktopEnabled ? 'bg-cyan-500' : 'bg-white/10'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${desktopEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone Panel */}
            <div className="glass-card p-8 box-border border-red-500/20">
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="text-red-500" size={20} />
                    <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
                </div>

                <p className="text-xs text-blue-400/60 mb-8">These actions are irreversible. Please be careful.</p>

                <form action={logout}>
                    <button type="submit"
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-black tracking-widest text-[10px] px-6 py-3 rounded-full flex items-center gap-2 transition-colors">
                        <LogOut size={16} />
                        SIGN OUT
                    </button>
                </form>
            </div>

        </div>
    )
}

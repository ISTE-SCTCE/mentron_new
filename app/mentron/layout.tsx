import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
// The public Mentron landing remains available; protected routes are checked in middleware.
export default function MentronLayout({children}: {children: React.ReactNode}) {
    return children
}

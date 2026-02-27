import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/app/components/Sidebar'
import { Footer } from '@/app/components/Footer'

export default async function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 flex flex-col min-h-screen w-full relative z-10 pt-32">
                <div className="flex-1 shrink-0 px-4 md:px-8 pb-8">
                    {children}
                </div>
                <div className="shrink-0 w-full relative z-20">
                    <Footer />
                </div>
            </main>
        </div>
    )
}

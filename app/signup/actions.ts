'use server'

import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string
    const rollNumber = formData.get('roll_number') as string
    const year = formData.get('year') as string
    const role = formData.get('role') as string

    // Auto-detect department from roll number
    const department = getDepartmentFromRollNumber(rollNumber)

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                roll_number: rollNumber,
                department: department,
                year: year,
                role: role,
            },
        },
    })

    if (signUpError) {
        console.error('Signup error:', signUpError)
        redirect(`/signup?error=${encodeURIComponent(signUpError.message)}`)
    }

    // We manually insert the profile here as a fallback in case 
    // the 'on_auth_user_created' database trigger in Supabase was never applied by the user.
    if (user) {
        const { error: profileError } = await supabase.from('profiles').insert({
            id: user.id,
            full_name: fullName,
            roll_number: rollNumber,
            department: department,
            year: year,
            role: role,
        })
        if (profileError) {
            console.error('Fallback profile creation error:', profileError)
        }
    }

    redirect('/login')
}

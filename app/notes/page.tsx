import { createClient } from '@/app/lib/supabase/server'
import { NotesClient } from './NotesClient'
import { getPermissions } from '@/app/lib/utils/coreAuth'

const SUBJECTS_BY_DEPT: Record<string, Record<string, string[]>> = {
  CSE: {
    S1: ['Mathematics I', 'Engineering Physics', 'Engineering Chemistry', 'Engineering Graphics', 'Basics of Civil & Mechanical'],
    S2: ['Mathematics II', 'Engineering Physics II', 'Basics of Electronics', 'Basics of Electrical', 'Engineering Mechanics'],
    S3: ['Data Structures', 'Digital Electronics', 'Discrete Mathematics', 'Computer Organization', 'Object Oriented Programming'],
    S4: ['Operating Systems', 'Database Management Systems', 'Software Engineering', 'Theory of Computation', 'Web Programming'],
    S5: ['Microprocessors', 'Computer Networks', 'Algorithm Design', 'Compiler Design', 'Computer Architecture'],
    S6: ['Distributed Systems', 'Cloud Computing', 'Information Security', 'Data Mining', 'Mobile Computing'],
    S7: ['Artificial Intelligence', 'Machine Learning', 'Blockchain', 'Advanced Databases', 'Project Management'],
    S8: ['Natural Language Processing', 'Deep Learning', 'Internet of Things', 'Industry Elective', 'Project'],
  },
  ECE: {
    S1: ['Mathematics I', 'Engineering Physics', 'Engineering Chemistry', 'Engineering Graphics', 'Basics of Civil & Mechanical'],
    S2: ['Mathematics II', 'Engineering Physics II', 'Basics of Electronics', 'Basics of Electrical', 'Engineering Mechanics'],
    S3: ['Signals & Systems', 'Network Analysis', 'Electronic Devices', 'Logic Design', 'Mathematics III'],
    S4: ['Analog Circuits', 'Digital Signal Processing', 'Electromagnetic Theory', 'Control Systems', 'Communication Theory'],
    S5: ['VLSI Design', 'Microprocessors', 'Digital Communication', 'Antennas', 'DSP Algorithms'],
    S6: ['RF & Microwave', 'Embedded Systems', 'Optical Communication', 'Computer Networks', 'Wireless Communication'],
    S7: ['Advanced VLSI', 'Image Processing', 'Radar Systems', 'Satellite Communication', 'Industry Elective'],
    S8: ['IoT & Sensors', 'AI for ECE', 'Industry Elective II', 'Mini Project', 'Project'],
  },
}

export const dynamic = 'force-dynamic'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
  const perms = await getPermissions()

  const { data: notes } = await supabase
    .from('notes')
    .select('*, profiles!notes_profile_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const dept = profile?.department || 'CSE'
  const subjectsByDept = SUBJECTS_BY_DEPT[dept] || SUBJECTS_BY_DEPT['CSE']

  return (
    <NotesClient
      notes={notes || []}
      dept={dept}
      subjectsByDept={subjectsByDept}
      isCoreOrExec={perms.isExec || perms.isCore}
      userId={user?.id}
    />
  )
}

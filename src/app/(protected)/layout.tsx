import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { TutorProviderWrapper } from '@/components/providers/TutorProviderWrapper'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <TutorProviderWrapper>
        <Navbar user={user} profile={profile} />
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          {children}
        </main>
      </TutorProviderWrapper>
    </div>
  )
}

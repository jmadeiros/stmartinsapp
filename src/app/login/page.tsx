import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/auth/login-form'
import { DevLogin } from './dev-login'

export default async function LoginPage() {
  const supabase = await createClient()

  // Check if user is already logged in
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md px-4">
        <LoginForm />
        <DevLogin />
      </div>
    </div>
  )
}

import LoginClient from '@/components/auth/LoginClient'

export const metadata = {
  title: 'Log In - TrackFolio',
}

import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">Loading...</div>}>
      <LoginClient />
    </Suspense>
  )
}

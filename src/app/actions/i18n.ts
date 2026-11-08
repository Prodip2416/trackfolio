'use server'

import { cookies } from 'next/headers'

export async function setLanguage(lang: 'en' | 'bn') {
  if (lang !== 'en' && lang !== 'bn') return
  const cookieStore = await cookies()
  cookieStore.set('NEXT_LOCALE', lang, {
    path: '/',
    maxAge: 31536000, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
}

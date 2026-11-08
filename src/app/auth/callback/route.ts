import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Email-confirmation / magic-link landing: exchanges the one-time code for a session.
// Supabase redirects here as <SITE_URL>/trackfolio/auth/callback?code=...&next=/...
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = request.nextUrl.searchParams.get('next') ?? '/'

  // Only allow same-site relative paths (blocks open redirects like //evil.com)
  const safeNext = next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/'

  // Route handlers don't re-apply basePath, so add it explicitly. A relative Location
  // keeps the browser's real host/port (request origin is the internal one behind Docker/proxies).
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const redirectTo = (path: string) =>
    new NextResponse(null, { status: 307, headers: { Location: `${base}${path}` } })

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return redirectTo(safeNext)
    }
    console.error('Auth callback error:', error)
  }

  return redirectTo('/login?error=auth_callback_failed')
}

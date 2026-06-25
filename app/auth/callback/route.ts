import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  // Log Google OAuth errors
  if (error) {
    console.error('[auth callback] Google OAuth error:', {
      error,
      errorDescription,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.redirect(`${origin}/auth/auth-code-error#error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    console.error('[auth callback] No authorization code received')
    return NextResponse.redirect(`${origin}/auth/auth-code-error#no_code`)
  }

  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('[auth callback] Session exchange failed:', {
        message: exchangeError.message,
        status: exchangeError.status,
        timestamp: new Date().toISOString(),
        code: code.substring(0, 10) + '...',
      })
      return NextResponse.redirect(`${origin}/auth/auth-code-error#exchange_failed`)
    }

    // Exchange successful
    const redirectUrl = next.startsWith('http') ? next : `${origin}${next}`
    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    console.error('[auth callback] Unexpected error:', {
      message: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    })
    return NextResponse.redirect(`${origin}/auth/auth-code-error#server_error`)
  }
}

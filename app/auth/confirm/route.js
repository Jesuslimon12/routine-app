import { NextResponse } from 'next/server'
import { createServerClient } from '@/app/lib/supabase'

const OTP_TYPES = new Set(['email', 'signup'])

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const supabase = await createServerClient()

  const confirmation = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && OTP_TYPES.has(type)
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error('Missing confirmation parameters.') }

  if (confirmation.error) {
    console.error('[authConfirm]', confirmation.error)
    return NextResponse.redirect(new URL('/login?error=confirmation', request.url))
  }

  const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })

  if (signOutError) {
    console.error('[authConfirm:signOut]', signOutError)
  }

  return NextResponse.redirect(new URL('/login?verified=1', request.url))
}

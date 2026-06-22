import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/auth/confirm']

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  )
}

export async function proxy(request) {
  let response = NextResponse.next({ request })
  let refreshedCookies = []

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        refreshedCookies = cookiesToSet
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // Keep this call directly after client creation so refreshes cannot be
  // skipped accidentally by unrelated proxy logic.
  const { data: claimsData } = await supabase.auth.getClaims()
  const isAuthenticated = Boolean(claimsData?.claims?.sub)

  const { pathname } = request.nextUrl
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  function redirectWithRefreshedCookies(url) {
    const redirectResponse = NextResponse.redirect(url)
    refreshedCookies.forEach(({ name, value, options }) => {
      redirectResponse.cookies.set(name, value, options)
    })
    return redirectResponse
  }

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return redirectWithRefreshedCookies(loginUrl)
  }

  if (isAuthenticated && isPublicPath) {
    return redirectWithRefreshedCookies(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

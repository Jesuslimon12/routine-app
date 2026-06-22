import 'server-only'

import { createHmac } from 'node:crypto'
import { headers } from 'next/headers'
import { createServerClient } from './supabase'

const DEVELOPMENT_SECRET = 'local-development-auth-rate-limit'
const VALID_ACTIONS = new Set(['login', 'register'])

function getRateLimitSecret() {
  const secret = process.env.AUTH_RATE_LIMIT_SECRET

  if (secret) return secret
  if (process.env.NODE_ENV !== 'production') return DEVELOPMENT_SECRET

  throw new Error('AUTH_RATE_LIMIT_SECRET is required in production.')
}

async function getClientIp() {
  const requestHeaders = await headers()
  const forwardedFor = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwardedFor || requestHeaders.get('x-real-ip')?.trim()

  return ip?.slice(0, 128) || 'local'
}

export async function consumeAuthRateLimit(action, email) {
  if (!VALID_ACTIONS.has(action)) {
    throw new Error('Unsupported authentication rate-limit action.')
  }

  try {
    const ip = await getClientIp()
    const bucketHash = createHmac('sha256', getRateLimitSecret())
      .update(`${action}:${ip}:${email}`)
      .digest('hex')

    const supabase = await createServerClient()
    const { data, error } = await supabase
      .rpc('consume_auth_rate_limit', {
        p_action: action,
        p_bucket_hash: bucketHash,
      })
      .single()

    if (error || !data) {
      console.error('[consumeAuthRateLimit]', error)
      return { allowed: false, retryAfterSeconds: 0, unavailable: true }
    }

    return {
      allowed: data.is_allowed,
      retryAfterSeconds: data.retry_after_seconds,
      unavailable: false,
    }
  } catch (error) {
    console.error('[consumeAuthRateLimit]', error)
    return { allowed: false, retryAfterSeconds: 0, unavailable: true }
  }
}

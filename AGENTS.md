<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Development principles

## Before writing code

Ask, in order:

1. Can existing code solve this?
2. Can a built-in Next.js feature solve this?
3. Can this use fewer files and less code?
4. Can this avoid a one-off custom hook or abstraction?
5. Can this avoid a new dependency?

## YAGNI

- Prefer the smallest direct solution that meets the current requirement.
- Do not add speculative abstractions, layers, options, or files.
- Extract shared code only after a real repeated use or boundary appears.
- Do not refactor unrelated code while implementing a focused change.

## Next.js 16

- Use the App Router and Server Components by default.
- Add `'use client'` only when a component needs state, effects, event handlers, or browser APIs. Keep the client boundary narrow.
- Prefer Server Actions for mutations initiated by the app UI.
- Use Route Handlers for public HTTP endpoints, webhooks, callbacks, or integrations—not as an internal data layer.
- Never call an internal Route Handler from a Server Component; call the server-side function or Supabase directly.
- Use Next.js caching and revalidation primitives before adding a caching library. Never share user-specific cached data between users.
- Use `proxy.js`, not `middleware.js`. Proxy may refresh sessions and perform optimistic redirects, but it is not the authorization boundary.
- Treat `cookies()`, `headers()`, `params`, and `searchParams` as async according to the installed Next.js documentation.

## React

- Avoid `useEffect` when rendering, an event handler, a Server Component, or a Server Action can solve the problem.
- Keep state local to the smallest component that owns it.
- Do not create a custom hook for a single use unless it isolates a meaningful lifecycle or external subscription.
- Prefer composition and explicit props over configurable wrapper abstractions.

## Authentication and authorization

- Supabase Auth is the only authentication system for this app; do not introduce BetterAuth or custom session formats.
- Use `@supabase/ssr` clients and their `getAll`/`setAll` cookie contract. Do not parse, construct, or validate Supabase auth cookies manually.
- Use `supabase.auth.getUser()` when fresh user data is required and `supabase.auth.getClaims()` when verified JWT claims are sufficient. Never authorize from `getSession()` data alone.
- Verify authentication and authorization in the server-side data access path for every protected read or mutation, even when `proxy.js` already checked the session.
- Never trust a user ID supplied by the client. Derive it from the verified Supabase user or claims.
- Keep Row Level Security enabled and write policies for every user-owned table. The anon/publishable key is safe only when RLS correctly protects the data.
- Never expose the Supabase service-role key to the browser or use it for normal user requests.

## Database

- Query Supabase directly from Server Components, Server Actions, or small server-only data functions.
- Avoid repository and service layers unless they remove demonstrated duplication or establish a real domain boundary.
- Select only the columns needed and propagate database errors deliberately.
- Let RLS enforce ownership in addition to explicit user filters in application queries.

## Forms and validation

- Server-side validation is authoritative for every mutation.
- Simple forms may use native `FormData`, HTML constraints, and direct validation.
- Use Zod when a schema is reused, nested, or complex enough to benefit from structured validation.
- Use React Hook Form when a client form needs substantial interactive validation or field management; do not add it to a simple Server Action form by default.
- Reuse the same schema on client and server when client validation is present, but always validate again on the server.

## Dependencies

- Prefer platform APIs, Node.js built-ins, Next.js features, and existing dependencies—in that order.
- Add a dependency only when it provides concrete value that would be costly or risky to reproduce.
- Check the installed package version and its local documentation before using an API.

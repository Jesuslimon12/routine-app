/**
 * Returns the current authenticated user from the Supabase session, or null.
 * Safe to call from Server Components, Server Actions, and Route Handlers.
 */
export async function getUser(supabase) {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null
  return data.user
}

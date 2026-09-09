import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anon) {
  console.warn('Missing VITE_SUPABASE_URL or ANON_KEY')
}

export const supabase = createClient(url || '', anon || '', {
  auth: { persistSession: true, autoRefreshToken: true }
})

export const EDGE_URL = `${url}/functions/v1/winzy-api`

export async function callEdge(path: string, body: any = {}, method: string = 'POST') {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch(`${EDGE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: method === 'GET' ? undefined : JSON.stringify(body)
  })
  const json = await res.json().catch(() => ({ ok:false, error:'Invalid JSON' }))
  if (!res.ok && !json.error) json.error = `HTTP ${res.status}`
  return json
}

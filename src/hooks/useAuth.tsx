import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Profile = {
  id: string
  email: string
  username: string
  balance: number
  lifetime_deposits: number
  lifetime_bets: number
  lifetime_wins: number
  is_admin: boolean
}

type AuthCtx = {
  user: any
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({ user:null, profile:null, loading:true, signOut: async()=>{}, refresh: async()=>{} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile|null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (uid:string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) setProfile(data as Profile)
  }

  const refresh = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUser(session.user)
      await loadProfile(session.user.id)
    }
  }

  useEffect(()=>{
    supabase.auth.getSession().then(async ({ data: { session } })=>{
      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session)=>{
      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      } else {
        setUser(null); setProfile(null)
      }
      setLoading(false)
    })
    return ()=> subscription.unsubscribe()
  },[])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null)
  }

  return <Ctx.Provider value={{ user, profile, loading, signOut, refresh }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)

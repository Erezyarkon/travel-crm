import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

export type Role = 'admin' | 'agent' | 'viewer'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
}

interface AuthContextValue {
  user: any | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: 'not ready' }),
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return (data as Profile) || null
  }

  async function refreshProfile() {
    if (user) {
      const p = await fetchProfile(user.id)
      setProfile(p)
    }
  }

  useEffect(() => {
    let active = true

    async function init() {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user || null
      if (!active) return
      setUser(sessionUser)
      if (sessionUser) {
        const p = await fetchProfile(sessionUser.id)
        if (active) setProfile(p)
      }
      if (active) setLoading(false)
    }
    init()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user || null
      setUser(sessionUser)
      if (sessionUser) {
        const p = await fetchProfile(sessionUser.id)
        setProfile(p)
      } else {
        setProfile(null)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

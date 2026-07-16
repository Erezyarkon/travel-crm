import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { Profile, Role } from './auth'

const supabaseUrl = 'https://axtudybnswroltfeubhj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHVkeWJuc3dyb2x0ZmV1YmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjgyNTksImV4cCI6MjA4NjY0NDI1OX0.9ypttpdLhB09ItaGyqp7EW0yje3jKb8njj49jN7Yeqs'

// A separate, isolated client used ONLY for creating new users.
// Using a second client (with no session persistence) means signing
// up a new user does NOT replace the admin's current session.
const signupClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export async function listProfiles(): Promise<Profile[]> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')
  return (data as Profile[]) || []
}

export interface NewUser {
  full_name: string
  email: string
  password: string
  role: Role
}

export async function createUser(u: NewUser): Promise<{ error: string | null }> {
  // 1. Create the auth user on the isolated client
  const { data, error } = await signupClient.auth.signUp({
    email: u.email.trim(),
    password: u.password,
  })
  if (error) return { error: error.message }
  const newId = data.user?.id
  if (!newId) return { error: 'User was not created. They may need to confirm their email first.' }

  // 2. Create their profile row (via the admin's normal client)
  const { error: pErr } = await supabase.from('profiles').insert({
    id: newId,
    full_name: u.full_name.trim(),
    email: u.email.trim(),
    role: u.role,
  })
  if (pErr) return { error: pErr.message }

  // Make sure the isolated client doesn't hold a session
  await signupClient.auth.signOut()
  return { error: null }
}

export async function updateUserRole(id: string, role: Role): Promise<{ error: string | null }> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  return { error: error ? error.message : null }
}

// Sends a password-reset email to the user
export async function sendPasswordReset(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  })
  return { error: error ? error.message : null }
}


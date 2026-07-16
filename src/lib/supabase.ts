import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://axtudybnswroltfeubhj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHVkeWJuc3dyb2x0ZmV1YmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjgyNTksImV4cCI6MjA4NjY0NDI1OX0.9ypttpdLhB09ItaGyqp7EW0yje3jKb8njj49jN7Yeqs'
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'crm' }
})

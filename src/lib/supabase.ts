import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://bjlrcainoeoeqxqljrpn.supabase.co'
const supabaseAnonKey = 'ANON_KEY_HERE'
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'public' }
})


import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://axtudybnswroltfeubhj.supabase.co'

const supabaseAnonKey = ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {

  db: { schema: 'crm' }

})


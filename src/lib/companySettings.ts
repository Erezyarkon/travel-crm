import { supabase } from './supabase'

export interface CompanySettings {
  company_name: string
  website: string
  phone: string
  email: string
  address: string
  default_currency: string
}

// Defaults match the values currently hardcoded into the voucher,
// so vouchers look identical until the user changes them.
export const DEFAULT_SETTINGS: CompanySettings = {
  company_name: 'EYT Erezyarkon Travel',
  website: 'erezyarkon.com',
  phone: '+972-50-000-0000',
  email: 'erez@erezyarkon.com',
  address: '',
  default_currency: 'USD',
}

const SETTINGS_ID = 'company'

// In-memory cache so the voucher can read settings synchronously after load
let cached: CompanySettings = { ...DEFAULT_SETTINGS }

export function getCachedSettings(): CompanySettings {
  return cached
}

export async function loadSettings(): Promise<CompanySettings> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', SETTINGS_ID)
      .single()
    if (error || !data) return cached
    cached = { ...DEFAULT_SETTINGS, ...(data.data || {}) }
    return cached
  } catch {
    return cached
  }
}

export async function saveSettings(values: CompanySettings): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ id: SETTINGS_ID, data: values }, { onConflict: 'id' })
    if (error) return false
    cached = { ...values }
    return true
  } catch {
    return false
  }
}

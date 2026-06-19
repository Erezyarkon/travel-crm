import { supabase } from './supabase'

export interface CompanySettings {
  company_name: string
  website: string
  phone: string
  email: string
  address: string
  default_currency: string
  // Business / invoicing
  legal_name: string        // official registered name
  business_number: string   // ח.פ. / ע.מ.
  business_type: string     // 'ltd' | 'licensed' | 'exempt'
  vat_percent: number       // e.g. 18
  default_vat_on: boolean   // whether new invoices include VAT by default
  invoice_prefix: string    // e.g. 'INV'
  next_invoice_number: number
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
  legal_name: '',
  business_number: '',
  business_type: 'ltd',
  vat_percent: 18,
  default_vat_on: false,   // tourism = 0% VAT by default
  invoice_prefix: 'INV',
  next_invoice_number: 1001,
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

// Reserve the next invoice number and advance the counter.
// Returns the formatted number string, e.g. "INV-1001".
export async function reserveInvoiceNumber(): Promise<{ display: string; raw: number } | null> {
  try {
    const current = await loadSettings()
    const raw = current.next_invoice_number || 1001
    const updated = { ...current, next_invoice_number: raw + 1 }
    const ok = await saveSettings(updated)
    if (!ok) return null
    const prefix = current.invoice_prefix || 'INV'
    return { display: `${prefix}-${raw}`, raw }
  } catch {
    return null
  }
}

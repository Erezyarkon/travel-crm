import { supabase } from './supabase'
import { reserveInvoiceNumber, loadSettings } from './companySettings'

export interface InvoiceLine {
  description: string
  qty: number
  unit_price: number
  amount: number   // qty * unit_price (stored for convenience/back-compat)
}

export interface Invoice {
  id: string
  client_id: string
  invoice_number: string
  issue_date: string
  currency: string
  lines: InvoiceLine[]
  subtotal: number
  vat_percent: number
  vat_amount: number
  total: number
  status: string        // 'draft' | 'issued' | 'paid' | 'cancelled'
  notes: string | null
  created_at: string
}

export function computeTotals(lines: InvoiceLine[], vatPercent: number, vatOn: boolean) {
  const subtotal = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0)
  const vat = vatOn ? subtotal * (vatPercent / 100) : 0
  return { subtotal, vat_amount: vat, total: subtotal + vat }
}

export async function listInvoices(clientId: string): Promise<Invoice[]> {
  const { data } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  return (data as Invoice[]) || []
}

export async function createInvoice(params: {
  clientId: string
  currency: string
  lines: InvoiceLine[]
  vatOn: boolean
  notes?: string
}): Promise<{ error: string | null; invoice?: Invoice }> {
  const settings = await loadSettings()
  const vatPercent = settings.vat_percent || 18
  const { subtotal, vat_amount, total } = computeTotals(params.lines, vatPercent, params.vatOn)

  const reserved = await reserveInvoiceNumber()
  if (!reserved) return { error: 'Could not reserve an invoice number.' }

  const { data, error } = await supabase.from('invoices').insert({
    client_id: params.clientId,
    invoice_number: reserved.display,
    issue_date: new Date().toISOString().slice(0, 10),
    currency: params.currency,
    lines: params.lines,
    subtotal,
    vat_percent: params.vatOn ? vatPercent : 0,
    vat_amount,
    total,
    status: 'issued',
    notes: params.notes || null,
  }).select().single()

  if (error) return { error: error.message }
  return { error: null, invoice: data as Invoice }
}

export async function deleteInvoice(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  return { error: error ? error.message : null }
}

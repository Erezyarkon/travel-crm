import { supabase } from './supabase'

// A provider-agnostic "request for payment" attached to a booking.
// This NEVER stores card numbers — only references returned by a provider.
export interface PaymentRequest {
  id: string
  booking_id: string
  amount: number
  currency: string
  flow: string            // 'link' | 'manual'
  status: string          // 'pending' | 'paid' | 'cancelled' | 'failed'
  provider: string | null // e.g. 'tranzila' once connected; null while agnostic
  transaction_ref: string | null  // provider's transaction id / approval reference
  card_last4: string | null       // last 4 digits ONLY (safe to store)
  pay_url: string | null          // hosted payment link, when a provider generates one
  note: string | null
  created_at: string
  paid_at: string | null
}

export const PAYMENT_FLOWS = [
  { key: 'link', label: 'Send payment link' },
  { key: 'manual', label: 'Manual / phone (MOTO)' },
]

export const PR_STATUS = {
  pending:   { label: 'Pending',   color: '#854F0B', bg: '#FAEEDA' },
  paid:      { label: 'Paid',      color: '#0F6E56', bg: '#E1F5EE' },
  cancelled: { label: 'Cancelled', color: '#5F5E5A', bg: '#F1EFE8' },
  failed:    { label: 'Failed',    color: '#A32D2D', bg: '#FBEAEA' },
} as const

export async function listPaymentRequests(bookingId: string): Promise<PaymentRequest[]> {
  const { data } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
  return (data as PaymentRequest[]) || []
}

export async function createPaymentRequest(params: {
  bookingId: string
  amount: number
  currency: string
  flow: string
  note?: string | null
}): Promise<{ error: string | null; request?: PaymentRequest }> {
  // NOTE: while no provider is connected, this simply records the intent.
  // When a gateway is wired in later, this is where we'd call the provider
  // to generate a hosted pay_url and store the returned reference.
  const { data, error } = await supabase.from('payment_requests').insert({
    booking_id: params.bookingId,
    amount: params.amount,
    currency: params.currency,
    flow: params.flow,
    status: 'pending',
    note: params.note || null,
  }).select().single()
  if (error) return { error: error.message }
  return { error: null, request: data as PaymentRequest }
}

// Mark a request paid. When a real provider confirms payment, this is called
// with the provider's safe references (never card data).
export async function markRequestPaid(
  id: string,
  details?: { provider?: string; transactionRef?: string; cardLast4?: string }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('payment_requests').update({
    status: 'paid',
    paid_at: new Date().toISOString(),
    provider: details?.provider || null,
    transaction_ref: details?.transactionRef || null,
    card_last4: details?.cardLast4 || null,
  }).eq('id', id)
  return { error: error ? error.message : null }
}

export async function updateRequestStatus(id: string, status: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('payment_requests').update({ status }).eq('id', id)
  return { error: error ? error.message : null }
}

export async function deletePaymentRequest(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('payment_requests').delete().eq('id', id)
  return { error: error ? error.message : null }
}

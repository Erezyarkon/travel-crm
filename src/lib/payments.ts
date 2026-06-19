import { supabase } from './supabase'

export interface Payment {
  id: string
  booking_id: string
  amount: number
  method: string
  paid_on: string | null
  note: string | null
  created_at: string
}

export const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Bank Transfer', 'Other']

export async function listPayments(bookingId: string): Promise<Payment[]> {
  const { data } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('paid_on', { ascending: true })
  return (data as Payment[]) || []
}

export async function addPayment(
  bookingId: string,
  amount: number,
  method: string,
  paidOn: string | null,
  note: string | null
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('payments').insert({
    booking_id: bookingId,
    amount,
    method,
    paid_on: paidOn,
    note: note || null,
  })
  return { error: error ? error.message : null }
}

export async function deletePayment(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('payments').delete().eq('id', id)
  return { error: error ? error.message : null }
}

// Update the supplier cost + currency on a booking
export async function updateBookingFinance(
  bookingId: string,
  costPrice: number | null,
  currency: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('bookings')
    .update({ cost_price: costPrice, currency })
    .eq('id', bookingId)
  return { error: error ? error.message : null }
}

export function sumPayments(payments: Payment[]): number {
  return payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
}

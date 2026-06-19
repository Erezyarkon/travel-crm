import { supabase } from './supabase'

export interface Supplier {
  id: string
  name: string
  type: string
  email: string | null
  phone: string | null
  contact: string | null
  payment_terms: string | null
  notes: string | null
}

export async function listSuppliers(): Promise<Supplier[]> {
  const { data } = await supabase.from('suppliers').select('*').order('name')
  return (data as Supplier[]) || []
}

// Bookings linked to a given supplier (with client name + financials)
export async function supplierBookings(supplierId: string) {
  const { data } = await supabase
    .from('bookings')
    .select('id, client_id, service_name, type, status, total_price, cost_price, currency, check_in, pickup_date, created_at, clients(full_name)')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false })
  return data || []
}

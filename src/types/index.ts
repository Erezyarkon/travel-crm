export type ClientStatus = 'lead' | 'active' | 'past'
export type BookingStatus = 'inquiry' | 'quoted' | 'confirmed' | 'paid' | 'voucher_sent' | 'completed' | 'cancelled'
export type BookingType = 'hotel' | 'car_rental' | 'transfer' | 'day_trip' | 'entrance' | 'meals' | 'flight' | 'visa'

export interface Traveler {
  id: string
  client_id: string
  full_name: string
  passport_number?: string
  date_of_birth?: string
  nationality?: string
  gender?: string
  is_lead: boolean
  age?: number
  type: 'adult' | 'child'
}

export interface Client {
  id: string
  file_number: string
  full_name: string
  phone: string
  email: string
  passport_number?: string
  date_of_birth?: string
  nationality?: string
  status: ClientStatus
  preferences?: string
  created_at: string
  travelers?: Traveler[]
}

export interface Booking {
  id: string
  client_id: string
  file_number: string
  type: BookingType
  status: BookingStatus
  service_name: string
  check_in?: string
  check_out?: string
  pickup_date?: string
  return_date?: string
  num_travelers: number
  total_price: number
  deposit_paid: number
  supplier_id?: string
  supplier_confirmation?: string
  notes?: string
  details: Record<string, any>
  created_at: string
}

export interface Supplier {
  id: string
  name: string
  type: BookingType
  contact_name?: string
  phone?: string
  email?: string
  notes?: string
}

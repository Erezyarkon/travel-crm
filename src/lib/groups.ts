import { supabase } from './supabase'

export interface Group {
  id: string
  name: string
  destination: string | null
  start_date: string | null
  end_date: string | null
  nights: number | null
  meal_plan: string | null
  pax_count: number | null
  stage: string
  price_per_person: number | null
  single_supplement: number | null
  currency: string
  notes: string | null
  owner_id: string | null
  created_at: string
  pricing?: any
  rooming?: any
  guide_driver?: string | null
}

// Stages mirror EM's real workflow:
// request -> plan_sent -> plan_approved -> pricing -> quote_sent -> quote_approved -> booking -> completed
export const GROUP_STAGES: Record<string, { label: string; color: string; bg: string }> = {
  request:        { label: 'Request',         color: '#5F5E5A', bg: '#F1F1F1' },
  plan_sent:      { label: 'Plan Sent',       color: '#854F0B', bg: '#FAEEDA' },
  plan_approved:  { label: 'Plan Approved',   color: '#185FA5', bg: '#E6F1FB' },
  pricing:        { label: 'Pricing',         color: '#854F0B', bg: '#FAEEDA' },
  quote_sent:     { label: 'Quote Sent',      color: '#185FA5', bg: '#E6F1FB' },
  quote_approved: { label: 'Quote Approved',  color: '#0F6E56', bg: '#E1F5EE' },
  booking:        { label: 'Booking',         color: '#534AB7', bg: '#EEEDFE' },
  completed:      { label: 'Completed',       color: '#0F6E56', bg: '#E1F5EE' },
  cancelled:      { label: 'Cancelled',       color: '#A32D2D', bg: '#FBEAEA' },
}

export const GROUP_STAGE_ORDER = [
  'request', 'plan_sent', 'plan_approved', 'pricing',
  'quote_sent', 'quote_approved', 'booking', 'completed',
]

export async function listGroups(): Promise<Group[]> {
  const { data } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false })
  return (data as Group[]) || []
}

export async function getGroup(id: string): Promise<Group | null> {
  const { data } = await supabase.from('groups').select('*').eq('id', id).single()
  return (data as Group) || null
}

export async function createGroup(params: Partial<Group> & { name: string }, ownerId: string | null): Promise<{ error: string | null; group?: Group }> {
  const { data, error } = await supabase.from('groups').insert({
    name: params.name,
    destination: params.destination || null,
    start_date: params.start_date || null,
    end_date: params.end_date || null,
    nights: params.nights ?? null,
    meal_plan: params.meal_plan || null,
    pax_count: params.pax_count ?? null,
    stage: params.stage || 'request',
    price_per_person: params.price_per_person ?? null,
    single_supplement: params.single_supplement ?? null,
    currency: params.currency || 'USD',
    notes: params.notes || null,
    owner_id: ownerId,
  }).select().single()
  if (error) return { error: error.message }
  return { error: null, group: data as Group }
}

export async function updateGroup(id: string, patch: Partial<Group>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('groups').update(patch).eq('id', id)
  return { error: error ? error.message : null }
}

export async function deleteGroup(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('groups').delete().eq('id', id)
  return { error: error ? error.message : null }
}

// Clients linked to a group
export async function groupClients(groupId: string) {
  const { data } = await supabase
    .from('clients')
    .select('id, full_name, file_number, status, phone, email')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
  return data || []
}

// Bookings linked to a group (directly via group_id, or via member clients)
export async function groupBookings(groupId: string) {
  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function assignClientToGroup(clientId: string, groupId: string | null): Promise<{ error: string | null }> {
  const { error } = await supabase.from('clients').update({ group_id: groupId }).eq('id', clientId)
  return { error: error ? error.message : null }
}

// Build a hotel programme from pricing days (collapse consecutive same-hotel days).
function hotelStays(pricing: any): { hotel: string; from: string; to: string; nights: number; costPerPerson: number }[] {
  const days = pricing?.days || []
  const stays: any[] = []
  let cur: any = null
  for (const d of days) {
    if (!d.hotel) { continue }
    if (cur && cur.hotel === d.hotel) {
      cur.to = d.date; cur.nights += 1; cur.costPerPerson += Number(d.hotel_dbl) || 0
    } else {
      if (cur) stays.push(cur)
      cur = { hotel: d.hotel, from: d.date, to: d.date, nights: 1, costPerPerson: Number(d.hotel_dbl) || 0 }
    }
  }
  if (cur) stays.push(cur)
  // 'to' should be checkout = day after last night
  return stays.map(s => {
    const out = s.to ? new Date(new Date(s.to).getTime() + 86400000).toISOString().slice(0, 10) : s.to
    return { ...s, to: out }
  })
}

// Convert a group's pricing into draft bookings (hotels, bus, guide).
// Creates/uses a central client file for the group. Entrances & meals are
// created manually by the user. Returns the central client id.
export async function createBookingsFromGroup(group: Group, ownerId: string | null): Promise<{ error: string | null; clientId?: string; created?: number }> {
  // 1. Find or create the central client file for this group
  let clientId: string | null = null
  const { data: existing } = await supabase
    .from('clients').select('id, file_number').eq('group_id', group.id).limit(1)
  if (existing && existing.length > 0) {
    clientId = existing[0].id
  } else {
    const fileNum = 'GRP-' + String(Date.now()).slice(-4).padStart(4, '0')
    const { data: client, error } = await supabase.from('clients').insert({
      full_name: group.name, file_number: fileNum, status: 'active',
      group_id: group.id, owner_id: ownerId,
    }).select().single()
    if (error || !client) return { error: error?.message || 'Could not create group client' }
    clientId = client.id
  }

  const pricing = group.pricing
  const pax = group.pax_count || (pricing?.tiers?.[0]) || 1
  const numDays = pricing?.days?.length || group.nights || 0
  const startDate = group.start_date
  const endDate = group.end_date
  const bookings: any[] = []

  // 2. Hotel bookings (one per hotel stay)
  for (const stay of hotelStays(pricing)) {
    bookings.push({
      type: 'hotel', client_id: clientId, file_number: '', group_id: group.id,
      service_name: stay.hotel,
      check_in: stay.from, check_out: stay.to,
      num_travelers: pax,
      total_price: 0,
      cost_price: Math.round(stay.costPerPerson * pax),
      currency: group.currency || 'USD',
      status: 'inquiry',
      notes: `${stay.nights} nights · from group pricing`,
      details: { from_group: true },
    })
  }

  // 3. Bus booking (whole period)
  if (pricing) {
    const vehicleDaily = pax <= 15 ? pricing.vehicle?.mini : pax <= 30 ? pricing.vehicle?.midi : pricing.vehicle?.bus
    const busCost = Math.round((vehicleDaily || 0) * numDays)
    bookings.push({
      type: 'transfer', client_id: clientId, file_number: '', group_id: group.id,
      service_name: 'Coach / Transport (full tour)',
      pickup_date: startDate, return_date: endDate,
      num_travelers: pax, total_price: 0, cost_price: busCost,
      currency: group.currency || 'USD', status: 'inquiry',
      notes: `${numDays} days · from group pricing`, details: { from_group: true },
    })

    // 4. Guide booking (whole period)
    const guideCost = Math.round((pricing.guide_fee_per_day || 0) * numDays)
    bookings.push({
      type: 'day_trip', client_id: clientId, file_number: '', group_id: group.id,
      service_name: 'Tour Guide (full tour)',
      pickup_date: startDate, return_date: endDate,
      num_travelers: pax, total_price: 0, cost_price: guideCost,
      currency: group.currency || 'USD', status: 'inquiry',
      notes: `${numDays} days · from group pricing`, details: { from_group: true },
    })
  }

  if (bookings.length === 0) return { error: 'No pricing data to convert. Fill the pricing calculator first.', clientId }

  const { error: bErr } = await supabase.from('bookings').insert(bookings)
  if (bErr) return { error: bErr.message, clientId }

  return { error: null, clientId, created: bookings.length }
}

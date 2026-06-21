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

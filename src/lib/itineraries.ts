import { supabase } from './supabase'

// ============================================================
// Types
// ============================================================
export interface ItineraryDay {
  id: string
  day_number: number
  title: string
  content: string
  depart_time: string | null
  return_time: string | null
}

export interface ItineraryTemplate {
  id: string
  title: string
  destination: string | null
  duration_label: string | null
  description: string | null
  image_url: string | null
  highlights: string[] | null
  source: string
  is_active: boolean
  created_at: string
  days?: ItineraryDay[]
}

export interface ClientItinerary {
  id: string
  group_id: string | null
  client_id: string | null
  source_template_id: string | null
  title: string
  start_date: string | null
  notes: string | null
  created_at: string
  days?: ItineraryDay[]
}

// ============================================================
// Templates (the shared library)
// ============================================================
export async function listTemplates(): Promise<ItineraryTemplate[]> {
  const { data, error } = await supabase
    .from('itinerary_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as ItineraryTemplate[]) || []
}

export async function getTemplate(id: string): Promise<ItineraryTemplate | null> {
  const { data: tpl, error } = await supabase.from('itinerary_templates').select('*').eq('id', id).single()
  if (error || !tpl) return null
  const { data: days } = await supabase
    .from('itinerary_template_days')
    .select('*')
    .eq('template_id', id)
    .order('day_number')
  return { ...(tpl as ItineraryTemplate), days: (days as ItineraryDay[]) || [] }
}

export async function createTemplate(params: {
  title: string; destination?: string; duration_label?: string; description?: string
  image_url?: string; highlights?: string[]
  days: { title: string; content: string; depart_time?: string; return_time?: string }[]
}): Promise<{ error: string | null; id?: string }> {
  const { data: tpl, error } = await supabase.from('itinerary_templates').insert({
    title: params.title,
    destination: params.destination || null,
    duration_label: params.duration_label || `${params.days.length} Days`,
    description: params.description || null,
    image_url: params.image_url || null,
    highlights: params.highlights || [],
    source: 'manual',
  }).select().single()
  if (error) return { error: error.message }

  if (params.days.length > 0) {
    const rows = params.days.map((d, i) => ({
      template_id: tpl.id, day_number: i + 1, title: d.title, content: d.content,
      depart_time: d.depart_time || null, return_time: d.return_time || null,
    }))
    const { error: daysErr } = await supabase.from('itinerary_template_days').insert(rows)
    if (daysErr) return { error: daysErr.message }
  }
  return { error: null, id: tpl.id }
}

export async function deleteTemplate(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('itinerary_templates').update({ is_active: false }).eq('id', id)
  return { error: error ? error.message : null }
}

// ============================================================
// Client / Group itineraries (private, editable copies)
// ============================================================
export async function getClientItinerary(id: string): Promise<ClientItinerary | null> {
  const { data: it, error } = await supabase.from('client_itineraries').select('*').eq('id', id).single()
  if (error || !it) return null
  const { data: days } = await supabase
    .from('client_itinerary_days')
    .select('*')
    .eq('itinerary_id', id)
    .order('day_number')
  return { ...(it as ClientItinerary), days: (days as ItineraryDay[]) || [] }
}

export async function getItineraryForGroup(groupId: string): Promise<ClientItinerary | null> {
  const { data } = await supabase.from('client_itineraries').select('id').eq('group_id', groupId).limit(1).maybeSingle()
  if (!data) return null
  return getClientItinerary(data.id)
}

/** Clone a template into a private, editable copy for a group (or standalone client). */
export async function applyTemplateToGroup(templateId: string, groupId: string): Promise<{ error: string | null; id?: string }> {
  const tpl = await getTemplate(templateId)
  if (!tpl) return { error: 'Template not found' }

  const { data: it, error } = await supabase.from('client_itineraries').insert({
    group_id: groupId,
    source_template_id: templateId,
    title: tpl.title,
  }).select().single()
  if (error) return { error: error.message }

  if (tpl.days && tpl.days.length > 0) {
    const rows = tpl.days.map(d => ({
      itinerary_id: it.id, day_number: d.day_number, title: d.title, content: d.content,
      depart_time: d.depart_time, return_time: d.return_time,
    }))
    const { error: daysErr } = await supabase.from('client_itinerary_days').insert(rows)
    if (daysErr) return { error: daysErr.message }
  }
  return { error: null, id: it.id }
}

/** Start a blank itinerary for a group, with no template. */
export async function createBlankItinerary(groupId: string, title: string): Promise<{ error: string | null; id?: string }> {
  const { data, error } = await supabase.from('client_itineraries').insert({ group_id: groupId, title }).select().single()
  if (error) return { error: error.message }
  return { error: null, id: data.id }
}

export async function updateItineraryMeta(id: string, patch: Partial<Pick<ClientItinerary, 'title' | 'start_date' | 'notes'>>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('client_itineraries').update(patch).eq('id', id)
  return { error: error ? error.message : null }
}

export async function deleteClientItinerary(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('client_itineraries').delete().eq('id', id)
  return { error: error ? error.message : null }
}

// ---- Day-level operations (the "rewrite / swap / drag" toolkit) ----

export async function addDay(itineraryId: string, afterDayNumber: number | null, draft?: Partial<ItineraryDay>): Promise<{ error: string | null }> {
  const { data: days } = await supabase.from('client_itinerary_days').select('*').eq('itinerary_id', itineraryId).order('day_number')
  const list = (days as ItineraryDay[]) || []
  const insertAt = afterDayNumber === null ? list.length : afterDayNumber
  const newDay = {
    itinerary_id: itineraryId,
    day_number: insertAt + 1,
    title: draft?.title || 'New Day',
    content: draft?.content || '',
    depart_time: draft?.depart_time || null,
    return_time: draft?.return_time || null,
  }
  // Shift everything after the insertion point up by one, then insert
  const toShift = list.filter(d => d.day_number > insertAt)
  for (const d of toShift) {
    await supabase.from('client_itinerary_days').update({ day_number: d.day_number + 1 }).eq('id', d.id)
  }
  const { error } = await supabase.from('client_itinerary_days').insert(newDay)
  return { error: error ? error.message : null }
}

export async function deleteDay(itineraryId: string, dayId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('client_itinerary_days').delete().eq('id', dayId)
  if (error) return { error: error.message }
  await renumberDays(itineraryId)
  return { error: null }
}

export async function duplicateDay(itineraryId: string, dayId: string): Promise<{ error: string | null }> {
  const { data: day } = await supabase.from('client_itinerary_days').select('*').eq('id', dayId).single()
  if (!day) return { error: 'Day not found' }
  return addDay(itineraryId, day.day_number, { title: `${day.title} (Copy)`, content: day.content, depart_time: day.depart_time, return_time: day.return_time })
}

export async function updateDay(dayId: string, patch: Partial<Pick<ItineraryDay, 'title' | 'content' | 'depart_time' | 'return_time'>>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('client_itinerary_days').update(patch).eq('id', dayId)
  return { error: error ? error.message : null }
}

/** Reorder days by passing the full ordered list of day IDs (after a drag-and-drop). */
export async function reorderDays(itineraryId: string, orderedDayIds: string[]): Promise<{ error: string | null }> {
  for (let i = 0; i < orderedDayIds.length; i++) {
    const { error } = await supabase.from('client_itinerary_days').update({ day_number: i + 1 }).eq('id', orderedDayIds[i])
    if (error) return { error: error.message }
  }
  return { error: null }
}

async function renumberDays(itineraryId: string): Promise<void> {
  const { data: days } = await supabase.from('client_itinerary_days').select('id, day_number').eq('itinerary_id', itineraryId).order('day_number')
  const list = days || []
  for (let i = 0; i < list.length; i++) {
    if (list[i].day_number !== i + 1) {
      await supabase.from('client_itinerary_days').update({ day_number: i + 1 }).eq('id', list[i].id)
    }
  }
}

/** Compute the calendar date for a given day, if the itinerary has a start_date. */
export function dayDate(startDate: string | null, dayNumber: number): string | null {
  if (!startDate) return null
  const d = new Date(startDate)
  d.setDate(d.getDate() + (dayNumber - 1))
  return d.toISOString().slice(0, 10)
}

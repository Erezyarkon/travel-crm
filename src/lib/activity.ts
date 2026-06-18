import { supabase } from './supabase'

export interface Activity {
  id: string
  client_id: string
  kind: string          // 'created' | 'status' | 'document' | 'traveler' | 'booking' | 'note' | 'call' | 'edit'
  message: string
  actor_id: string | null
  actor_name: string | null
  created_at: string
}

// Fire-and-forget logging. Never blocks or throws into the UI.
export async function logActivity(
  clientId: string,
  kind: string,
  message: string,
  actorId: string | null,
  actorName: string | null
): Promise<void> {
  try {
    await supabase.from('activities').insert({
      client_id: clientId,
      kind,
      message,
      actor_id: actorId,
      actor_name: actorName,
    })
  } catch {
    // Logging must never break the primary action.
  }
}

export async function listActivities(clientId: string): Promise<Activity[]> {
  const { data } = await supabase
    .from('activities')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  return (data as Activity[]) || []
}

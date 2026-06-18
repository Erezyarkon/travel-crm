import { supabase } from './supabase'

export interface Task {
  id: string
  client_id: string
  title: string
  due_date: string | null
  done: boolean
  created_by: string | null
  created_at: string
  // joined client info (optional, used on dashboard)
  clients?: { full_name: string; owner_id: string } | null
}

export async function listTasks(clientId: string): Promise<Task[]> {
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', clientId)
    .order('done', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
  return (data as Task[]) || []
}

export async function createTask(
  clientId: string,
  title: string,
  dueDate: string | null,
  userId: string | null
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('tasks').insert({
    client_id: clientId,
    title: title.trim(),
    due_date: dueDate || null,
    created_by: userId,
  })
  return { error: error ? error.message : null }
}

export async function toggleTask(id: string, done: boolean): Promise<void> {
  await supabase.from('tasks').update({ done }).eq('id', id)
}

export async function deleteTask(id: string): Promise<void> {
  await supabase.from('tasks').delete().eq('id', id)
}

// For the dashboard: all open tasks the current user can see.
// RLS already restricts agents to their own clients' tasks.
export async function listOpenTasks(): Promise<Task[]> {
  const { data } = await supabase
    .from('tasks')
    .select('*, clients(full_name, owner_id)')
    .eq('done', false)
    .order('due_date', { ascending: true, nullsFirst: false })
  return (data as Task[]) || []
}

import { supabase } from './supabase'

export const DOCS_BUCKET = 'client-documents'

export const DOC_CATEGORIES = [
  'Passport',
  'Visa',
  'Contract',
  'Flight Ticket',
  'Insurance',
  'Voucher',
  'Other',
] as const

export type DocCategory = typeof DOC_CATEGORIES[number]

export interface ClientDocument {
  id: string
  client_id: string
  file_name: string
  storage_path: string
  category: string
  size_bytes: number | null
  uploaded_by: string | null
  created_at: string
}

// Files are stored under: {client_id}/{timestamp}-{filename}
export async function listDocuments(clientId: string): Promise<ClientDocument[]> {
  const { data } = await supabase
    .from('client_documents')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  return (data as ClientDocument[]) || []
}

export async function uploadDocument(
  clientId: string,
  file: File,
  category: string,
  userId: string | null
): Promise<{ error: string | null }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${clientId}/${Date.now()}-${safeName}`

  const { error: upErr } = await supabase.storage
    .from(DOCS_BUCKET)
    .upload(path, file, { upsert: false })
  if (upErr) return { error: upErr.message }

  const { error: dbErr } = await supabase.from('client_documents').insert({
    client_id: clientId,
    file_name: file.name,
    storage_path: path,
    category,
    size_bytes: file.size,
    uploaded_by: userId,
  })
  if (dbErr) {
    // Roll back the uploaded file if the DB row failed
    await supabase.storage.from(DOCS_BUCKET).remove([path])
    return { error: dbErr.message }
  }
  return { error: null }
}

// Returns a short-lived signed URL for a private file
export async function getDownloadUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(DOCS_BUCKET)
    .createSignedUrl(storagePath, 60) // valid 60 seconds
  if (error) return null
  return data.signedUrl
}

export async function deleteDocument(doc: ClientDocument): Promise<{ error: string | null }> {
  const { error: sErr } = await supabase.storage.from(DOCS_BUCKET).remove([doc.storage_path])
  if (sErr) return { error: sErr.message }
  const { error: dErr } = await supabase.from('client_documents').delete().eq('id', doc.id)
  return { error: dErr ? dErr.message : null }
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

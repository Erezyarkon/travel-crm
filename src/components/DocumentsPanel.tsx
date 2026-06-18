import React, { useEffect, useRef, useState } from 'react'
import { FileText, Upload, Download, Trash2, File } from 'lucide-react'
import {
  ClientDocument, DOC_CATEGORIES, listDocuments, uploadDocument,
  getDownloadUrl, deleteDocument, formatBytes,
} from '../lib/documents'
import { useAuth } from '../lib/auth'

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Passport: { bg: '#E6F1FB', color: '#185FA5' },
  Visa: { bg: '#EEEDFE', color: '#534AB7' },
  Contract: { bg: '#FAEEDA', color: '#854F0B' },
  'Flight Ticket': { bg: '#B5D4F4', color: '#0C447C' },
  Insurance: { bg: '#E1F5EE', color: '#0F6E56' },
  Voucher: { bg: '#FFF8E6', color: '#B8860B' },
  Other: { bg: '#F1EFE8', color: '#5F5E5A' },
}

export default function DocumentsPanel({ clientId }: { clientId: string }) {
  const { user } = useAuth()
  const [docs, setDocs] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState<string>('Passport')
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  async function refresh() {
    setLoading(true)
    setDocs(await listDocuments(clientId))
    setLoading(false)
  }
  useEffect(() => { refresh() }, [clientId])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (f.size > 25 * 1024 * 1024) { setError(`${f.name} is larger than 25MB.`); continue }
      const { error } = await uploadDocument(clientId, f, category, user?.id || null)
      if (error) setError(error)
    }
    setUploading(false)
    if (fileInput.current) fileInput.current.value = ''
    refresh()
  }

  async function handleDownload(doc: ClientDocument) {
    const url = await getDownloadUrl(doc.storage_path)
    if (url) window.open(url, '_blank')
    else setError('Could not generate download link.')
  }

  async function handleDelete(doc: ClientDocument) {
    if (!window.confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return
    const { error } = await deleteDocument(doc)
    if (error) setError(error)
    else refresh()
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={13} color="#185FA5" /> Documents ({docs.length})
        </span>
      </div>

      {/* Category selector + upload zone */}
      <div style={{ marginBottom: 10 }}>
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ width: '100%', fontSize: 11, padding: '5px 8px', borderRadius: 6, border: '0.5px solid #d0d0d0', background: '#fafafa', cursor: 'pointer', outline: 'none', marginBottom: 8 }}>
          {DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div
          onClick={() => fileInput.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          style={{
            border: `1.5px dashed ${dragOver ? '#185FA5' : '#d0d0d0'}`,
            borderRadius: 10, padding: '16px 12px', textAlign: 'center', cursor: 'pointer',
            background: dragOver ? '#E6F1FB' : '#fafafa', transition: 'all 0.15s',
          }}>
          <Upload size={18} color={dragOver ? '#185FA5' : '#aaa'} style={{ marginBottom: 4 }} />
          <div style={{ fontSize: 11, color: '#888' }}>
            {uploading ? 'Uploading…' : 'Tap or drop a file here'}
          </div>
          <div style={{ fontSize: 9, color: '#bbb', marginTop: 2 }}>as {category} · up to 25MB</div>
        </div>
        <input ref={fileInput} type="file" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
      </div>

      {error && <div style={{ fontSize: 11, color: '#A32D2D', marginBottom: 8 }}>{error}</div>}

      {/* File list */}
      {loading ? (
        <div style={{ padding: 14, textAlign: 'center', color: '#aaa', fontSize: 12 }}>Loading…</div>
      ) : docs.length === 0 ? (
        <div style={{ padding: 14, textAlign: 'center', color: '#bbb', fontSize: 12 }}>No documents uploaded yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {docs.map(doc => {
            const cc = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.Other
            return (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', background: '#fafafa', borderRadius: 8, border: '0.5px solid #eee' }}>
                <div style={{ background: cc.bg, borderRadius: 6, padding: 5, flexShrink: 0 }}><File size={13} color={cc.color} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</div>
                  <div style={{ fontSize: 9, color: '#999' }}>
                    <span style={{ color: cc.color, fontWeight: 600 }}>{doc.category}</span>
                    {doc.size_bytes ? ` · ${formatBytes(doc.size_bytes)}` : ''}
                  </div>
                </div>
                <button onClick={() => handleDownload(doc)} title="Download" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#185FA5' }}>
                  <Download size={14} />
                </button>
                <button onClick={() => handleDelete(doc)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#A32D2D' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

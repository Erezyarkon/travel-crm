import React, { useEffect, useState } from 'react'
import {
  History, MessageSquarePlus, Phone, StickyNote, FilePlus, UserPlus,
  RefreshCw, CircleDot, Pencil,
} from 'lucide-react'
import { Activity, listActivities, logActivity } from '../lib/activity'
import { useAuth } from '../lib/auth'

const KIND_META: Record<string, { icon: any; color: string; bg: string }> = {
  created:  { icon: CircleDot,    color: '#0F6E56', bg: '#E1F5EE' },
  status:   { icon: RefreshCw,    color: '#185FA5', bg: '#E6F1FB' },
  document: { icon: FilePlus,     color: '#534AB7', bg: '#EEEDFE' },
  traveler: { icon: UserPlus,     color: '#854F0B', bg: '#FAEEDA' },
  booking:  { icon: CircleDot,    color: '#3B6D11', bg: '#EAF3DE' },
  edit:     { icon: Pencil,       color: '#5F5E5A', bg: '#F1EFE8' },
  note:     { icon: StickyNote,   color: '#854F0B', bg: '#FAEEDA' },
  call:     { icon: Phone,        color: '#0F6E56', bg: '#E1F5EE' },
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function ActivityPanel({ clientId, refreshKey }: { clientId: string; refreshKey?: number }) {
  const { user, profile } = useAuth()
  const [items, setItems] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<'note' | 'call' | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    setItems(await listActivities(clientId))
    setLoading(false)
  }
  useEffect(() => { refresh() }, [clientId, refreshKey])

  async function handleAdd() {
    if (!text.trim() || !adding) return
    setBusy(true)
    await logActivity(clientId, adding, text.trim(), user?.id || null, profile?.full_name || null)
    setBusy(false)
    setText(''); setAdding(null)
    refresh()
  }

  const card: React.CSSProperties = { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }

  return (
    <div style={card}>
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <History size={15} color="#185FA5" /> Activity
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setAdding(adding === 'note' ? null : 'note'); setText('') }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '5px 10px', borderRadius: 7, border: '0.5px solid #e0e0e0', background: adding === 'note' ? '#FAEEDA' : '#fff', color: '#854F0B', cursor: 'pointer', fontWeight: 500 }}>
            <StickyNote size={12} /> Note
          </button>
          <button onClick={() => { setAdding(adding === 'call' ? null : 'call'); setText('') }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '5px 10px', borderRadius: 7, border: '0.5px solid #e0e0e0', background: adding === 'call' ? '#E1F5EE' : '#fff', color: '#0F6E56', cursor: 'pointer', fontWeight: 500 }}>
            <Phone size={12} /> Log Call
          </button>
        </div>
      </div>

      {adding && (
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0', background: '#fafafa' }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
            placeholder={adding === 'call' ? 'What was discussed on the call?' : 'Add a note…'}
            style={{ width: '100%', minHeight: 60, padding: '8px 10px', border: '0.5px solid #d0d0d0', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleAdd} disabled={busy || !text.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: busy || !text.trim() ? 'default' : 'pointer', fontWeight: 600, fontSize: 12, opacity: busy || !text.trim() ? 0.6 : 1 }}>
              <MessageSquarePlus size={13} /> {busy ? 'Saving…' : 'Add'}
            </button>
            <button onClick={() => { setAdding(null); setText('') }}
              style={{ background: '#fff', color: '#555', border: '0.5px solid #d0d0d0', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#bbb', fontSize: 13 }}>No activity yet.</div>
      ) : (
        <div style={{ padding: '8px 0' }}>
          {items.map((a, idx) => {
            const meta = KIND_META[a.kind] || KIND_META.note
            const Icon = meta.icon
            const isLast = idx === items.length - 1
            return (
              <div key={a.id} style={{ display: 'flex', gap: 10, padding: '6px 16px', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ background: meta.bg, borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={13} color={meta.color} />
                  </div>
                  {!isLast && <div style={{ width: 1, flex: 1, background: '#eee', marginTop: 2, minHeight: 8 }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: 8, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#333', lineHeight: 1.4 }}>{a.message}</div>
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
                    {a.actor_name ? `${a.actor_name} · ` : ''}{timeAgo(a.created_at)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

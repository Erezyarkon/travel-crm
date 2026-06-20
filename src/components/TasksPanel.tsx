import React, { useEffect, useState } from 'react'
import { CheckSquare, Square, Plus, Trash2, CalendarClock } from 'lucide-react'
import EmptyState from './EmptyState'
import { Task, listTasks, createTask, toggleTask, deleteTask } from '../lib/tasks'
import { useAuth } from '../lib/auth'

function dueMeta(due: string | null, done: boolean) {
  if (done) return { label: 'Done', color: '#9aa0a6', bg: '#F1F1F1' }
  if (!due) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(due); d.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  const txt = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  if (diff < 0) return { label: `Overdue · ${txt}`, color: '#A32D2D', bg: '#FBEAEA' }
  if (diff === 0) return { label: `Today`, color: '#854F0B', bg: '#FAEEDA' }
  if (diff === 1) return { label: `Tomorrow`, color: '#854F0B', bg: '#FAEEDA' }
  return { label: txt, color: '#185FA5', bg: '#E6F1FB' }
}

export default function TasksPanel({ clientId }: { clientId: string }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    setTasks(await listTasks(clientId))
    setLoading(false)
  }
  useEffect(() => { refresh() }, [clientId])

  async function handleAdd() {
    if (!title.trim()) return
    setBusy(true)
    await createTask(clientId, title, due || null, user?.id || null)
    setBusy(false)
    setTitle(''); setDue(''); setAdding(false)
    refresh()
  }

  async function handleToggle(t: Task) {
    await toggleTask(t.id, !t.done)
    refresh()
  }

  async function handleDelete(t: Task) {
    if (!window.confirm(`Delete task "${t.title}"?`)) return
    await deleteTask(t.id)
    refresh()
  }

  const openCount = tasks.filter(t => !t.done).length

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarClock size={13} color="#854F0B" /> Tasks {openCount > 0 && <span style={{ color: '#854F0B' }}>({openCount})</span>}
        </span>
        <button onClick={() => { setAdding(a => !a); setTitle(''); setDue('') }}
          style={{ fontSize: 10, color: '#854F0B', background: adding ? '#fff' : '#FAEEDA', border: '0.5px solid #E0B877', borderRadius: 20, padding: '2px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
          {adding ? 'Cancel' : <><Plus size={11} /> Add</>}
        </button>
      </div>

      {adding && (
        <div style={{ marginBottom: 10, padding: 10, background: '#fafafa', borderRadius: 8, border: '0.5px solid #eee' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} autoFocus placeholder="e.g. Call back about hotel"
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            style={{ width: '100%', padding: '7px 9px', border: '0.5px solid #d0d0d0', borderRadius: 7, fontSize: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 7 }} />
          <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            <input type="date" value={due} onChange={e => setDue(e.target.value)}
              style={{ flex: 1, padding: '6px 9px', border: '0.5px solid #d0d0d0', borderRadius: 7, fontSize: 12, outline: 'none', background: '#fff' }} />
            <button onClick={handleAdd} disabled={busy || !title.trim()}
              style={{ background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 14px', cursor: busy || !title.trim() ? 'default' : 'pointer', fontWeight: 600, fontSize: 12, opacity: busy || !title.trim() ? 0.6 : 1 }}>
              {busy ? '…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 12, textAlign: 'center', color: '#aaa', fontSize: 12 }}>Loading…</div>
      ) : tasks.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No tasks yet" hint="Add a reminder to follow up with this client." compact />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {tasks.map(t => {
            const meta = dueMeta(t.due_date, t.done)
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', background: t.done ? '#fafafa' : '#fff', borderRadius: 8, border: '0.5px solid #eee' }}>
                <button onClick={() => handleToggle(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}>
                  {t.done ? <CheckSquare size={16} color="#0F6E56" /> : <Square size={16} color="#bbb" />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: t.done ? '#aaa' : '#333', textDecoration: t.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                  {meta && !t.done && <span style={{ fontSize: 9, color: meta.color, fontWeight: 600 }}>{meta.label}</span>}
                </div>
                <button onClick={() => handleDelete(t)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, display: 'flex', color: '#ccc', flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

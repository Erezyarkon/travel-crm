import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users2, Calendar, MapPin } from 'lucide-react'
import { Group, listGroups, createGroup, GROUP_STAGES, GROUP_STAGE_ORDER } from '../lib/groups'
import { CURRENCIES } from '../lib/currency'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { SkeletonRows } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

export default function Groups() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)

  async function load() {
    setLoading(true)
    setGroups(await listGroups())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = stageFilter === 'all' ? groups : groups.filter(g => g.stage === stageFilter)

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Group Tours</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Manage group tour files end-to-end</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <Plus size={15} /> New Group
        </button>
      </div>

      {/* Stage filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {['all', ...GROUP_STAGE_ORDER, 'cancelled'].map(s => (
          <button key={s} onClick={() => setStageFilter(s)}
            style={{ padding: '5px 11px', borderRadius: 20, border: '0.5px solid', fontSize: 12, cursor: 'pointer', fontWeight: stageFilter === s ? 600 : 400, borderColor: stageFilter === s ? '#1a2a3a' : '#e0e0e0', background: stageFilter === s ? '#1a2a3a' : '#fff', color: stageFilter === s ? '#fff' : '#555' }}>
            {s === 'all' ? 'All' : GROUP_STAGES[s]?.label || s}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <SkeletonRows rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users2} title={stageFilter === 'all' ? 'No group tours yet' : 'No groups in this stage'} hint={stageFilter === 'all' ? 'Create your first group tour file to get started.' : undefined} action={stageFilter === 'all' ? { label: '+ New Group', onClick: () => setShowNew(true) } : undefined} />
        ) : filtered.map(g => {
          const st = GROUP_STAGES[g.stage] || GROUP_STAGES.request
          return (
            <div key={g.id} onClick={() => navigate(`/groups/${g.id}`)}
              style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', borderBottom: '0.5px solid #f5f5f5' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users2 size={20} color="#534AB7" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{g.name}</div>
                <div style={{ fontSize: 11.5, color: '#888', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {g.destination && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin size={11} /> {g.destination}</span>}
                  {g.start_date && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Calendar size={11} /> {fmtDate(g.start_date)}{g.end_date ? ` – ${fmtDate(g.end_date)}` : ''}</span>}
                  {g.pax_count ? <span>{g.pax_count} pax</span> : null}
                </div>
              </div>
              <span style={{ fontSize: 11, padding: '3px 11px', borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600, whiteSpace: 'nowrap' }}>{st.label}</span>
            </div>
          )
        })}
      </div>

      {showNew && <NewGroupModal onClose={() => setShowNew(false)} onCreated={async (id) => { setShowNew(false); await load(); toast.success('Group created'); navigate(`/groups/${id}`) }} ownerId={user?.id || null} />}
    </div>
  )
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function NewGroupModal({ onClose, onCreated, ownerId }: { onClose: () => void; onCreated: (id: string) => void; ownerId: string | null }) {
  const toast = useToast()
  const [f, setF] = useState({ name: '', destination: 'Israel – Holy Land', start_date: '', end_date: '', meal_plan: 'HB', pax_count: '', currency: 'USD' })
  const [busy, setBusy] = useState(false)
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))

  function nights(): number | null {
    if (!f.start_date || !f.end_date) return null
    const ms = new Date(f.end_date).getTime() - new Date(f.start_date).getTime()
    const n = Math.round(ms / 86400000)
    return n > 0 ? n : null
  }

  async function save() {
    if (!f.name.trim()) { toast.error('Please enter a group name'); return }
    setBusy(true)
    const { error, group } = await createGroup({
      name: f.name.trim(), destination: f.destination || null,
      start_date: f.start_date || null, end_date: f.end_date || null,
      nights: nights(), meal_plan: f.meal_plan || null,
      pax_count: f.pax_count ? parseInt(f.pax_count) : null,
      currency: f.currency,
    }, ownerId)
    setBusy(false)
    if (error || !group) { toast.error('Could not create group'); return }
    onCreated(group.id)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '0.5px solid #d0d0d0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 11, color: '#888', fontWeight: 500, display: 'block', marginBottom: 3 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 22, width: 480, maxWidth: '100%' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>New Group Tour</h2>
        <div style={{ marginBottom: 11 }}>
          <label style={lbl}>Group Name *</label>
          <input style={inp} value={f.name} onChange={e => s('name', e.target.value)} placeholder="e.g. Group Lakan – Holy Land 2027" autoFocus />
        </div>
        <div style={{ marginBottom: 11 }}>
          <label style={lbl}>Destination</label>
          <input style={inp} value={f.destination} onChange={e => s('destination', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 11 }}>
          <div><label style={lbl}>Start Date</label><input type="date" style={inp} value={f.start_date} onChange={e => s('start_date', e.target.value)} /></div>
          <div><label style={lbl}>End Date</label><input type="date" style={inp} value={f.end_date} onChange={e => s('end_date', e.target.value)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
          <div>
            <label style={lbl}>Meal Plan</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={f.meal_plan} onChange={e => s('meal_plan', e.target.value)}>
              <option value="HB">HB</option><option value="BB">BB</option><option value="FB">FB</option><option value="RO">RO</option>
            </select>
          </div>
          <div><label style={lbl}>Pax</label><input type="number" style={inp} value={f.pax_count} onChange={e => s('pax_count', e.target.value)} placeholder="0" /></div>
          <div>
            <label style={lbl}>Currency</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={f.currency} onChange={e => s('currency', e.target.value)}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#fff', border: '0.5px solid #ccc', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={save} disabled={busy} style={{ padding: '8px 18px', background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, cursor: busy ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  )
}

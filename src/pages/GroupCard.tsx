import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users2, Calendar, MapPin, Utensils, DollarSign, Trash2, ExternalLink, FileText, CalendarPlus } from 'lucide-react'
import {
  Group, getGroup, updateGroup, deleteGroup, groupClients, groupBookings,
  GROUP_STAGES, GROUP_STAGE_ORDER, createBookingsFromGroup,
} from '../lib/groups'
import { useAuth } from '../lib/auth'
import { formatMoney } from '../lib/currency'
import { useToast } from '../lib/toast'
import GroupPricingPanel from '../components/GroupPricingPanel'
import GroupRoomingPanel from '../components/GroupRoomingPanel'
import GroupQuoteModal from '../components/GroupQuoteModal'

export default function GroupCard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const [creatingBk, setCreatingBk] = useState(false)
  const [group, setGroup] = useState<Group | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuote, setShowQuote] = useState(false)

  async function load() {
    if (!id) return
    setLoading(true)
    const [g, cs, bs] = await Promise.all([getGroup(id), groupClients(id), groupBookings(id)])
    setGroup(g); setClients(cs); setBookings(bs)
    setLoading(false)
  }
  useEffect(() => { load() }, [id])

  async function setStage(stage: string) {
    if (!id) return
    await updateGroup(id, { stage })
    setGroup(g => g ? { ...g, stage } : g)
    toast.success(`Stage: ${GROUP_STAGES[stage]?.label || stage}`)
  }

  async function handleDelete() {
    if (!id || !group) return
    if (!window.confirm(`Delete group "${group.name}"? This does not delete linked client files, only the group.`)) return
    await deleteGroup(id)
    toast.info('Group deleted')
    navigate('/groups')
  }

  async function handleCreateBookings() {
    if (!group) return
    if (!group.pricing || !group.pricing.days || group.pricing.days.length === 0) {
      toast.error('Fill the pricing calculator first')
      return
    }
    if (!window.confirm('Create draft bookings (hotels, coach, guide) from the pricing? Entrance fees and meals you add manually afterwards.')) return
    setCreatingBk(true)
    const { error, clientId, created } = await createBookingsFromGroup(group, user?.id || null)
    setCreatingBk(false)
    if (error) { toast.error(error); return }
    toast.success(`Created ${created} bookings`)
    await load()
    if (clientId) navigate(`/clients/${clientId}`)
  }

  if (loading) return <div style={{ padding: 24, color: '#888' }}>Loading…</div>
  if (!group) return <div style={{ padding: 24, color: '#888' }}>Group not found.</div>

  const cur = group.currency || 'USD'
  // Financial rollup from linked bookings
  const totalPrice = bookings.reduce((s, b) => s + (Number(b.total_price) || 0), 0)
  const totalCost = bookings.reduce((s, b) => s + (Number(b.cost_price) || 0), 0)
  const totalPaid = bookings.reduce((s, b) => s + (Number(b.deposit_paid) || 0), 0)
  const profit = totalPrice - totalCost
  const st = GROUP_STAGES[group.stage] || GROUP_STAGES.request

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate('/groups')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 13, marginBottom: 14 }}>
        <ArrowLeft size={15} /> All Groups
      </button>

      {/* Header */}
      <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users2 size={26} color="#534AB7" />
            </div>
            <div>
              <h1 style={{ fontSize: 21, fontWeight: 700 }}>{group.name}</h1>
              <div style={{ fontSize: 12.5, color: '#888', marginTop: 4, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {group.destination && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {group.destination}</span>}
                {group.start_date && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {fmtDate(group.start_date)}{group.end_date ? ` – ${fmtDate(group.end_date)}` : ''}{group.nights ? ` (${group.nights} nights)` : ''}</span>}
                {group.meal_plan && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Utensils size={12} /> {group.meal_plan}</span>}
                {group.pax_count ? <span>{group.pax_count} pax</span> : null}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handleCreateBookings} disabled={creatingBk} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: creatingBk ? 'default' : 'pointer', fontWeight: 600, fontSize: 12.5, opacity: creatingBk ? 0.6 : 1 }}>
              <CalendarPlus size={14} /> {creatingBk ? 'Creating…' : 'Create Bookings'}
            </button>
            <button onClick={() => setShowQuote(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12.5 }}>
              <FileText size={14} /> Quotation
            </button>
            <button onClick={handleDelete} title="Delete group" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 4 }}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Stage progression */}
      <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 10 }}>WORKFLOW STAGE</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {GROUP_STAGE_ORDER.map((s, i) => {
            const meta = GROUP_STAGES[s]
            const active = group.stage === s
            const passed = GROUP_STAGE_ORDER.indexOf(group.stage) > i
            return (
              <React.Fragment key={s}>
                <button onClick={() => setStage(s)}
                  style={{ padding: '6px 12px', borderRadius: 20, border: '0.5px solid', fontSize: 11.5, cursor: 'pointer', fontWeight: active ? 700 : 500,
                    borderColor: active ? meta.color : (passed ? '#cde5dc' : '#e5e5e5'),
                    background: active ? meta.bg : (passed ? '#F4FBF8' : '#fff'),
                    color: active ? meta.color : (passed ? '#0F6E56' : '#999') }}>
                  {passed ? '✓ ' : ''}{meta.label}
                </button>
                {i < GROUP_STAGE_ORDER.length - 1 && <span style={{ color: '#ddd', fontSize: 11 }}>→</span>}
              </React.Fragment>
            )
          })}
          <button onClick={() => setStage('cancelled')}
            style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 20, border: '0.5px solid', fontSize: 11.5, cursor: 'pointer', fontWeight: group.stage === 'cancelled' ? 700 : 500,
              borderColor: group.stage === 'cancelled' ? '#A32D2D' : '#e5e5e5', background: group.stage === 'cancelled' ? '#FBEAEA' : '#fff', color: group.stage === 'cancelled' ? '#A32D2D' : '#bbb' }}>
            Cancelled
          </button>
        </div>
      </div>

      {/* Financial rollup */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <RollupCard label="Total Price" value={formatMoney(totalPrice, cur)} color="#185FA5" bg="#E6F1FB" />
        <RollupCard label="Total Cost" value={formatMoney(totalCost, cur)} color="#A32D2D" bg="#FBEAEA" />
        <RollupCard label="Profit" value={formatMoney(profit, cur)} color={profit >= 0 ? '#0F6E56' : '#A32D2D'} bg="#E1F5EE" />
        <RollupCard label="Paid (deposits)" value={formatMoney(totalPaid, cur)} color="#854F0B" bg="#FAEEDA" />
      </div>

      {/* Pricing summary */}
      {(group.price_per_person || group.single_supplement) && (
        <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', gap: 28 }}>
          {group.price_per_person ? (
            <div><div style={{ fontSize: 11, color: '#888' }}>Price / person (double)</div><div style={{ fontSize: 18, fontWeight: 700, color: '#1a2a3a' }}>{formatMoney(group.price_per_person, cur)}</div></div>
          ) : null}
          {group.single_supplement ? (
            <div><div style={{ fontSize: 11, color: '#888' }}>Single supplement</div><div style={{ fontSize: 18, fontWeight: 700, color: '#1a2a3a' }}>{formatMoney(group.single_supplement, cur)}</div></div>
          ) : null}
        </div>
      )}

      {/* Pricing calculator */}
      <GroupPricingPanel group={group} onSaved={(price, single) => setGroup(g => g ? { ...g, price_per_person: price, single_supplement: single } : g)} />

      {/* Rooming list */}
      <GroupRoomingPanel group={group} onSaved={(rooms, guideDriver) => setGroup(g => g ? { ...g, rooming: rooms, guide_driver: guideDriver } : g)} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Members */}
        <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0', fontSize: 13, fontWeight: 600 }}>
            Members ({clients.length})
          </div>
          {clients.length === 0 ? (
            <div style={{ padding: 18, fontSize: 12, color: '#bbb', textAlign: 'center' }}>No client files linked yet. Open a client and use "Link to group".</div>
          ) : clients.map(c => (
            <div key={c.id} onClick={() => navigate(`/clients/${c.id}`)}
              style={{ padding: '11px 16px', borderBottom: '0.5px solid #f8f8f8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.full_name}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{c.file_number}{c.phone ? ` · ${c.phone}` : ''}</div>
              </div>
              <ExternalLink size={13} color="#ccc" />
            </div>
          ))}
        </div>

        {/* Bookings */}
        <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0', fontSize: 13, fontWeight: 600 }}>
            Bookings ({bookings.length})
          </div>
          {bookings.length === 0 ? (
            <div style={{ padding: 18, fontSize: 12, color: '#bbb', textAlign: 'center' }}>No bookings linked to this group yet.</div>
          ) : bookings.map(b => (
            <div key={b.id} style={{ padding: '11px 16px', borderBottom: '0.5px solid #f8f8f8', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{b.service_name || b.type}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{b.type}</div>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1a2a3a' }}>{formatMoney(Number(b.total_price) || 0, cur)}</div>
            </div>
          ))}
        </div>
      </div>

      {group.notes && (
        <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, padding: 16, marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6 }}>NOTES</div>
          <div style={{ fontSize: 13, color: '#333', whiteSpace: 'pre-wrap' }}>{group.notes}</div>
        </div>
      )}

      {showQuote && <GroupQuoteModal group={group} onClose={() => setShowQuote(false)} />}
    </div>
  )
}

function RollupCard({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, color: '#888' }}>{label}</span>
        <div style={{ background: bg, borderRadius: 7, padding: 5 }}><DollarSign size={14} color={color} /></div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
    </div>
  )
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

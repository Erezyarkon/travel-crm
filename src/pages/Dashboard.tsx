import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, CalendarDays, DollarSign, TrendingUp, Plus, ChevronRight,
  AlertCircle, Clock, CreditCard, CheckCircle2, CalendarClock, CheckSquare,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { listOpenTasks } from '../lib/tasks'

const statusLabels: Record<string, string> = {
  inquiry: 'Inquiry', quoted: 'Quoted', confirmed: 'Confirmed',
  paid: 'Paid', voucher_sent: 'Voucher Sent', completed: 'Completed', cancelled: 'Cancelled',
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}
function fmtDate(d?: string) {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}
function bookingDate(b: any): string {
  return b.check_in || b.pickup_date || ''
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [stats, setStats] = useState({ clients: 0, bookings: 0, revenue: 0, leads: 0 })
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [unhandledLeads, setUnhandledLeads] = useState<any[]>([])
  const [awaitingPayment, setAwaitingPayment] = useState<any[]>([])
  const [openTasks, setOpenTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!profile) return
      setLoading(true)
      const isAgent = profile.role === 'agent'

      // Build client + booking queries that respect ownership for agents.
      let clientsQ = supabase.from('clients').select('*')
      if (isAgent) clientsQ = clientsQ.eq('owner_id', profile.id)

      const { data: clients } = await clientsQ
      const clientIds = (clients || []).map(c => c.id)
      const ownById: Record<string, any> = {}
      ;(clients || []).forEach(c => { ownById[c.id] = c })

      // Bookings — for agents, limit to their clients' bookings
      let bookingsQ = supabase.from('bookings').select('*')
      if (isAgent) {
        if (clientIds.length === 0) {
          bookingsQ = bookingsQ.eq('client_id', '00000000-0000-0000-0000-000000000000')
        } else {
          bookingsQ = bookingsQ.in('client_id', clientIds)
        }
      }
      const { data: bookings } = await bookingsQ

      const allClients = clients || []
      const allBookings = bookings || []

      // KPIs
      const revenue = allBookings
        .filter(b => ['paid', 'voucher_sent', 'completed'].includes(b.status))
        .reduce((s, b) => s + (Number(b.total_price) || 0), 0)
      const leads = allClients.filter(c => c.status === 'lead')

      setStats({
        clients: allClients.length,
        bookings: allBookings.filter(b => b.status !== 'cancelled').length,
        revenue,
        leads: leads.length,
      })

      // Upcoming trips: next 14 days, not cancelled/completed
      const up = allBookings
        .filter(b => !['cancelled', 'completed'].includes(b.status))
        .map(b => ({ ...b, _d: daysUntil(bookingDate(b)), _client: ownById[b.client_id] }))
        .filter(b => bookingDate(b) && b._d >= 0 && b._d <= 14)
        .sort((a, b) => a._d - b._d)
        .slice(0, 8)
      setUpcoming(up)

      // Unhandled leads: clients with status 'lead', newest first
      setUnhandledLeads(
        leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6)
      )

      // Awaiting payment: confirmed or quoted bookings (not yet paid)
      const pay = allBookings
        .filter(b => ['quoted', 'confirmed'].includes(b.status))
        .map(b => ({ ...b, _client: ownById[b.client_id] }))
        .slice(0, 6)
      setAwaitingPayment(pay)

      // Open tasks (RLS limits agents to their own clients automatically)
      const tasks = await listOpenTasks()
      setOpenTasks(tasks.slice(0, 8))

      setLoading(false)
    }
    load()
  }, [profile])

  const statCards = [
    { label: profile?.role === 'agent' ? 'My Clients' : 'Total Clients', value: stats.clients, icon: Users, color: '#185FA5', bg: '#E6F1FB' },
    { label: 'Active Leads', value: stats.leads, icon: TrendingUp, color: '#0F6E56', bg: '#E1F5EE' },
    { label: 'Bookings', value: stats.bookings, icon: CalendarDays, color: '#854F0B', bg: '#FAEEDA' },
    { label: 'Revenue (USD)', value: `$${stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: '#3B6D11', bg: '#EAF3DE' },
  ]

  const firstName = profile?.full_name?.split(' ')[0] || ''
  const card: React.CSSProperties = { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }
  const head: React.CSSProperties = { padding: '14px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>{firstName ? `Welcome back, ${firstName}` : 'Dashboard'}</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Here's what needs your attention today</p>
        </div>
        <button onClick={() => navigate('/clients/new')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <Plus size={15} /> New Client File
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
              <div style={{ background: bg, borderRadius: 8, padding: 6 }}><Icon size={16} color={color} /></div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          {/* Upcoming trips */}
          <div style={card}>
            <div style={head}>
              <span style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Clock size={15} color="#854F0B" /> Upcoming (next 14 days)
              </span>
              <button onClick={() => navigate('/bookings')} style={{ background: 'none', border: 'none', color: '#185FA5', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>All <ChevronRight size={13} /></button>
            </div>
            {upcoming.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', color: '#aaa', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={24} color="#cdcdcd" />
                Nothing in the next two weeks.
              </div>
            ) : upcoming.map(b => {
              const d = b._d
              const badge = d === 0 ? { t: 'Today', c: '#A32D2D', bg: '#FBEAEA' } : d === 1 ? { t: 'Tomorrow', c: '#854F0B', bg: '#FAEEDA' } : { t: `in ${d}d`, c: '#185FA5', bg: '#E6F1FB' }
              return (
                <div key={b.id} onClick={() => b.client_id && navigate(`/clients/${b.client_id}`)} style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: '0.5px solid #f8f8f8' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ textAlign: 'center', minWidth: 42 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1a2a3a' }}>{fmtDate(bookingDate(b))}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.service_name || statusLabels[b.status]}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{b._client?.full_name || b.file_number}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 20, background: badge.bg, color: badge.c, fontWeight: 600, whiteSpace: 'nowrap' }}>{badge.t}</span>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Unhandled leads */}
            <div style={card}>
              <div style={head}>
                <span style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <AlertCircle size={15} color="#0F6E56" /> New Leads
                </span>
                <button onClick={() => navigate('/clients')} style={{ background: 'none', border: 'none', color: '#185FA5', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>All <ChevronRight size={13} /></button>
              </div>
              {unhandledLeads.length === 0 ? (
                <div style={{ padding: 22, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No open leads. 🎉</div>
              ) : unhandledLeads.map(c => (
                <div key={c.id} onClick={() => navigate(`/clients/${c.id}`)} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: '0.5px solid #f8f8f8' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#0F6E56' }}>
                    {c.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{c.full_name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{fmtDate(c.created_at)}</div>
                  </div>
                  <ChevronRight size={14} color="#ccc" />
                </div>
              ))}
            </div>

            {/* Awaiting payment */}
            <div style={card}>
              <div style={head}>
                <span style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <CreditCard size={15} color="#854F0B" /> Awaiting Payment
                </span>
              </div>
              {awaitingPayment.length === 0 ? (
                <div style={{ padding: 22, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Nothing pending.</div>
              ) : awaitingPayment.map(b => (
                <div key={b.id} onClick={() => b.client_id && navigate(`/clients/${b.client_id}`)} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: '0.5px solid #f8f8f8' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b._client?.full_name || b.service_name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{statusLabels[b.status]} · ${Number(b.total_price || 0).toLocaleString()}</div>
                  </div>
                  <ChevronRight size={14} color="#ccc" />
                </div>
              ))}
            </div>

            {/* Tasks due */}
            <div style={card}>
              <div style={head}>
                <span style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <CalendarClock size={15} color="#854F0B" /> Tasks Due
                </span>
              </div>
              {openTasks.length === 0 ? (
                <div style={{ padding: 22, textAlign: 'center', color: '#aaa', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <CheckSquare size={22} color="#cdcdcd" /> All caught up.
                </div>
              ) : openTasks.map(t => {
                const meta = taskDueMeta(t.due_date)
                return (
                  <div key={t.id} onClick={() => t.client_id && navigate(`/clients/${t.client_id}`)} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: '0.5px solid #f8f8f8' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{t.clients?.full_name || ''}</div>
                    </div>
                    {meta && <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 20, background: meta.bg, color: meta.color, fontWeight: 600, whiteSpace: 'nowrap' }}>{meta.label}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function taskDueMeta(due: string | null) {
  if (!due) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(due); d.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  const txt = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  if (diff < 0) return { label: 'Overdue', color: '#A32D2D', bg: '#FBEAEA' }
  if (diff === 0) return { label: 'Today', color: '#854F0B', bg: '#FAEEDA' }
  if (diff === 1) return { label: 'Tomorrow', color: '#854F0B', bg: '#FAEEDA' }
  return { label: `in ${diff}d`, color: '#185FA5', bg: '#E6F1FB' }
}

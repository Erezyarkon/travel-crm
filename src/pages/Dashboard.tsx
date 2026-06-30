import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, CalendarDays, DollarSign, TrendingUp, Plus, ChevronRight,
  AlertCircle, Clock, CreditCard, CheckCircle2, CalendarClock, CheckSquare,
  ArrowUpRight, ArrowDownRight, Minus, Activity, Zap, BarChart3,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { listOpenTasks } from '../lib/tasks'
import { BOOKING_STATUS_LABELS as statusLabels } from '../lib/status'

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

function getMonthRange(monthsBack: number) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
  const end = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 0, 23, 59, 59)
  return { start, end }
}

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null
  const up = pct >= 0
  const color = up ? '#0F6E56' : '#A32D2D'
  const bg = up ? '#E1F5EE' : '#FBEAEA'
  const Icon = pct === 0 ? Minus : up ? ArrowUpRight : ArrowDownRight
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 700, color, background: bg, borderRadius: 20, padding: '2px 7px' }}>
      <Icon size={10} />
      {Math.abs(pct).toFixed(0)}%
    </span>
  )
}

// Mini sparkline using SVG
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const w = 80, h = 28
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - (v / max) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      <circle cx={(values.length - 1) / (values.length - 1) * w} cy={h - (values[values.length - 1] / max) * h} r={2.5} fill={color} />
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [stats, setStats] = useState({ clients: 0, bookings: 0, revenue: 0, leads: 0 })
  const [trends, setTrends] = useState<{ clients: number | null; revenue: number | null; bookings: number | null; leads: number | null }>({
    clients: null, revenue: null, bookings: null, leads: null
  })
  const [revenueHistory, setRevenueHistory] = useState<number[]>([])
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [unhandledLeads, setUnhandledLeads] = useState<any[]>([])
  const [awaitingPayment, setAwaitingPayment] = useState<any[]>([])
  const [openTasks, setOpenTasks] = useState<any[]>([])
  const [todayActivity, setTodayActivity] = useState<{ checkIns: number; checkOuts: number; pending: number }>({ checkIns: 0, checkOuts: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Good morning')
    else if (h < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  useEffect(() => {
    async function load() {
      if (!profile) return
      setLoading(true)
      const isAgent = profile.role === 'agent'

      let clientsQ = supabase.from('clients').select('*')
      if (isAgent) clientsQ = clientsQ.eq('owner_id', profile.id)
      const { data: clients } = await clientsQ
      const clientIds = (clients || []).map(c => c.id)
      const ownById: Record<string, any> = {}
      ;(clients || []).forEach(c => { ownById[c.id] = c })

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

      // KPIs - current month
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

      const revenue = allBookings
        .filter(b => ['paid', 'voucher_sent', 'completed'].includes(b.status))
        .reduce((s, b) => s + (Number(b.total_price) || 0), 0)
      const leads = allClients.filter(c => c.status === 'lead')

      // Last month comparisons
      const lastMonthRevenue = allBookings
        .filter(b => ['paid', 'voucher_sent', 'completed'].includes(b.status))
        .filter(b => { const d = new Date(b.created_at); return d >= lastMonthStart && d <= lastMonthEnd })
        .reduce((s, b) => s + (Number(b.total_price) || 0), 0)
      const thisMonthRevenue = allBookings
        .filter(b => ['paid', 'voucher_sent', 'completed'].includes(b.status))
        .filter(b => { const d = new Date(b.created_at); return d >= thisMonthStart })
        .reduce((s, b) => s + (Number(b.total_price) || 0), 0)

      const lastMonthClients = allClients.filter(c => { const d = new Date(c.created_at); return d >= lastMonthStart && d <= lastMonthEnd }).length
      const thisMonthClients = allClients.filter(c => new Date(c.created_at) >= thisMonthStart).length
      const lastMonthBookings = allBookings.filter(b => { const d = new Date(b.created_at); return d >= lastMonthStart && d <= lastMonthEnd && b.status !== 'cancelled' }).length
      const thisMonthBookings = allBookings.filter(b => new Date(b.created_at) >= thisMonthStart && b.status !== 'cancelled').length
      const lastMonthLeads = allClients.filter(c => c.status === 'lead' && new Date(c.created_at) >= lastMonthStart && new Date(c.created_at) <= lastMonthEnd).length
      const thisMonthLeads = allClients.filter(c => c.status === 'lead' && new Date(c.created_at) >= thisMonthStart).length

      const calcTrend = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : null) : Math.round(((curr - prev) / prev) * 100)

      setTrends({
        revenue: calcTrend(thisMonthRevenue, lastMonthRevenue),
        clients: calcTrend(thisMonthClients, lastMonthClients),
        bookings: calcTrend(thisMonthBookings, lastMonthBookings),
        leads: calcTrend(thisMonthLeads, lastMonthLeads),
      })

      // Revenue history (last 6 months)
      const history: number[] = []
      for (let i = 5; i >= 0; i--) {
        const { start, end } = getMonthRange(i)
        const m = allBookings
          .filter(b => ['paid', 'voucher_sent', 'completed'].includes(b.status))
          .filter(b => { const d = new Date(b.created_at); return d >= start && d <= end })
          .reduce((s, b) => s + (Number(b.total_price) || 0), 0)
        history.push(m)
      }
      setRevenueHistory(history)

      setStats({
        clients: allClients.length,
        bookings: allBookings.filter(b => b.status !== 'cancelled').length,
        revenue,
        leads: leads.length,
      })

      // Today's pulse
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
      const checkIns = allBookings.filter(b => {
        const d = b.check_in ? new Date(b.check_in) : null
        return d && d >= today && d < tomorrow && !['cancelled'].includes(b.status)
      }).length
      const checkOuts = allBookings.filter(b => {
        const d = b.check_out ? new Date(b.check_out) : null
        return d && d >= today && d < tomorrow && !['cancelled'].includes(b.status)
      }).length
      const pending = allBookings.filter(b => ['quoted', 'confirmed'].includes(b.status)).length
      setTodayActivity({ checkIns, checkOuts, pending })

      // Upcoming trips
      const up = allBookings
        .filter(b => !['cancelled', 'completed'].includes(b.status))
        .map(b => ({ ...b, _d: daysUntil(bookingDate(b)), _client: ownById[b.client_id] }))
        .filter(b => bookingDate(b) && b._d >= 0 && b._d <= 14)
        .sort((a, b) => a._d - b._d)
        .slice(0, 8)
      setUpcoming(up)

      setUnhandledLeads(
        leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6)
      )

      const pay = allBookings
        .filter(b => ['quoted', 'confirmed'].includes(b.status))
        .map(b => ({ ...b, _client: ownById[b.client_id] }))
        .slice(0, 6)
      setAwaitingPayment(pay)

      const tasks = await listOpenTasks()
      setOpenTasks(tasks.slice(0, 8))

      setLoading(false)
    }
    load()
  }, [profile])

  const firstName = profile?.full_name?.split(' ')[0] || ''
  const card: React.CSSProperties = { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }
  const head: React.CSSProperties = { padding: '14px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }

  const statCards = [
    {
      label: profile?.role === 'agent' ? 'My Clients' : 'Total Clients',
      value: stats.clients,
      trend: trends.clients,
      sparkValues: null,
      icon: Users, color: '#185FA5', bg: '#E6F1FB',
      sub: `${stats.leads} leads`,
    },
    {
      label: 'Active Leads',
      value: stats.leads,
      trend: trends.leads,
      sparkValues: null,
      icon: TrendingUp, color: '#0F6E56', bg: '#E1F5EE',
      sub: 'awaiting conversion',
    },
    {
      label: 'Active Bookings',
      value: stats.bookings,
      trend: trends.bookings,
      sparkValues: null,
      icon: CalendarDays, color: '#854F0B', bg: '#FAEEDA',
      sub: `${todayActivity.pending} pending payment`,
    },
    {
      label: 'Total Revenue',
      value: `$${stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      trend: trends.revenue,
      sparkValues: revenueHistory,
      icon: DollarSign, color: '#3B6D11', bg: '#EAF3DE',
      sub: 'vs last month',
    },
  ]

  return (
    <div style={{ padding: 24, background: '#f7f8fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>
            {firstName ? `${greeting}, ${firstName} 👋` : 'Dashboard'}
          </h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 3 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/reports')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#555', border: '0.5px solid #d0d0d0', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>
            <BarChart3 size={14} /> Reports
          </button>
          <button onClick={() => navigate('/clients/new')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <Plus size={15} /> New Client File
          </button>
        </div>
      </div>

      {/* Today's Pulse Bar */}
      {!loading && (todayActivity.checkIns > 0 || todayActivity.checkOuts > 0 || todayActivity.pending > 0) && (
        <div style={{ background: 'linear-gradient(135deg, #1a2a3a 0%, #2d3f50 100%)', borderRadius: 12, padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={14} color="#f5c842" />
            <span style={{ color: '#f5c842', fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>TODAY'S PULSE</span>
          </div>
          {todayActivity.checkIns > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
              <span style={{ color: '#e0e0e0', fontSize: 12 }}><strong style={{ color: '#fff' }}>{todayActivity.checkIns}</strong> check-in{todayActivity.checkIns > 1 ? 's' : ''} today</span>
            </div>
          )}
          {todayActivity.checkOuts > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fb923c' }} />
              <span style={{ color: '#e0e0e0', fontSize: 12 }}><strong style={{ color: '#fff' }}>{todayActivity.checkOuts}</strong> check-out{todayActivity.checkOuts > 1 ? 's' : ''} today</span>
            </div>
          )}
          {todayActivity.pending > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#facc15' }} />
              <span style={{ color: '#e0e0e0', fontSize: 12 }}><strong style={{ color: '#fff' }}>{todayActivity.pending}</strong> awaiting payment</span>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {statCards.map(({ label, value, trend, sparkValues, icon: Icon, color, bg, sub }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
            {/* subtle bg tint */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: bg, borderRadius: '0 12px 0 80px', opacity: 0.4 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, position: 'relative' }}>
              <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{label}</span>
              <div style={{ background: bg, borderRadius: 8, padding: 6 }}><Icon size={16} color={color} /></div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', marginBottom: 6, position: 'relative' }}>{value}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendBadge pct={trend} />
                <span style={{ fontSize: 10, color: '#aaa' }}>{sub}</span>
              </div>
              {sparkValues && sparkValues.length > 1 && (
                <Sparkline values={sparkValues} color={color} />
              )}
            </div>
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
                <Clock size={15} color="#854F0B" /> Upcoming Trips
                <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}>(next 14 days)</span>
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
              const badge = d === 0
                ? { t: 'Today', c: '#A32D2D', bg: '#FBEAEA' }
                : d === 1
                  ? { t: 'Tomorrow', c: '#854F0B', bg: '#FAEEDA' }
                  : { t: `in ${d}d`, c: '#185FA5', bg: '#E6F1FB' }
              return (
                <div key={b.id} onClick={() => b.client_id && navigate(`/clients/${b.client_id}`)}
                  style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: '0.5px solid #f8f8f8' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ textAlign: 'center', minWidth: 42, background: '#f7f8fa', borderRadius: 8, padding: '4px 6px' }}>
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

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Unhandled leads */}
            <div style={card}>
              <div style={head}>
                <span style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <AlertCircle size={15} color="#0F6E56" /> New Leads
                  {unhandledLeads.length > 0 && (
                    <span style={{ background: '#0F6E56', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '1px 7px' }}>{unhandledLeads.length}</span>
                  )}
                </span>
                <button onClick={() => navigate('/clients')} style={{ background: 'none', border: 'none', color: '#185FA5', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>All <ChevronRight size={13} /></button>
              </div>
              {unhandledLeads.length === 0 ? (
                <div style={{ padding: 22, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No open leads. 🎉</div>
              ) : unhandledLeads.map(c => (
                <div key={c.id} onClick={() => navigate(`/clients/${c.id}`)}
                  style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: '0.5px solid #f8f8f8' }}
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
                  {awaitingPayment.length > 0 && (
                    <span style={{ background: '#854F0B', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '1px 7px' }}>{awaitingPayment.length}</span>
                  )}
                </span>
              </div>
              {awaitingPayment.length === 0 ? (
                <div style={{ padding: 22, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Nothing pending.</div>
              ) : awaitingPayment.map(b => (
                <div key={b.id} onClick={() => b.client_id && navigate(`/clients/${b.client_id}`)}
                  style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: '0.5px solid #f8f8f8' }}
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
                  {openTasks.filter(t => { const m = taskDueMeta(t.due_date); return m?.label === 'Overdue' || m?.label === 'Today' }).length > 0 && (
                    <span style={{ background: '#A32D2D', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '1px 7px' }}>
                      {openTasks.filter(t => { const m = taskDueMeta(t.due_date); return m?.label === 'Overdue' || m?.label === 'Today' }).length}
                    </span>
                  )}
                </span>
              </div>
              {openTasks.length === 0 ? (
                <div style={{ padding: 22, textAlign: 'center', color: '#aaa', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <CheckSquare size={22} color="#cdcdcd" /> All caught up.
                </div>
              ) : openTasks.map(t => {
                const meta = taskDueMeta(t.due_date)
                return (
                  <div key={t.id} onClick={() => t.client_id && navigate(`/clients/${t.client_id}`)}
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: '0.5px solid #f8f8f8' }}
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
  if (diff < 0) return { label: 'Overdue', color: '#A32D2D', bg: '#FBEAEA' }
  if (diff === 0) return { label: 'Today', color: '#854F0B', bg: '#FAEEDA' }
  if (diff === 1) return { label: 'Tomorrow', color: '#854F0B', bg: '#FAEEDA' }
  return { label: `in ${diff}d`, color: '#185FA5', bg: '#E6F1FB' }
}

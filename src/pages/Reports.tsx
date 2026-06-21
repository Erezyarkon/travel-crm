import React, { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import {
  DollarSign, CalendarDays, TrendingUp, Receipt,
  BedDouble, Car, Bus, Map, Ticket, UtensilsCrossed, Plane, Shield,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const BOOKING_TYPES = [
  { key: 'hotel',      label: 'Hotel',      icon: BedDouble,       color: '#185FA5' },
  { key: 'car_rental', label: 'Car Rental', icon: Car,             color: '#0F6E56' },
  { key: 'transfer',   label: 'Transfer',   icon: Bus,             color: '#854F0B' },
  { key: 'day_trip',   label: 'Day Trip',   icon: Map,             color: '#3B6D11' },
  { key: 'entrance',   label: 'Entrance',   icon: Ticket,          color: '#534AB7' },
  { key: 'meals',      label: 'Meals',      icon: UtensilsCrossed, color: '#993556' },
  { key: 'flight',     label: 'Flights',    icon: Plane,           color: '#0C447C' },
  { key: 'vip',        label: 'VIP',        icon: Shield,          color: '#B8860B' },
]

const STATUS_COLORS: Record<string, string> = {
  inquiry: '#9aa0a6', quoted: '#854F0B', confirmed: '#185FA5',
  paid: '#3B6D11', voucher_sent: '#0F6E56', completed: '#0F6E56', cancelled: '#A32D2D',
}
const STATUS_LABELS: Record<string, string> = {
  inquiry: 'Inquiry', quoted: 'Quoted', confirmed: 'Confirmed',
  paid: 'Paid', voucher_sent: 'Voucher Sent', completed: 'Completed', cancelled: 'Cancelled',
}
// Statuses that represent money actually collected
const REVENUE_STATUSES = ['paid', 'voucher_sent', 'completed']

const PERIODS = [
  { key: '1m', label: 'This Month', months: 1 },
  { key: '3m', label: 'Last 3 Months', months: 3 },
  { key: '6m', label: 'Last 6 Months', months: 6 },
  { key: '12m', label: 'This Year', months: 12 },
  { key: 'all', label: 'All Time', months: 0 },
  { key: 'custom', label: 'Custom Range…', months: -1 },
]

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5' }
const sectionHead: React.CSSProperties = { padding: '14px 16px', borderBottom: '0.5px solid #f0f0f0', fontWeight: 600, fontSize: 14 }

export default function Reports() {
  const [periodKey, setPeriodKey] = useState('6m')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [bookings, setBookings] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: b }, { data: c }] = await Promise.all([
        supabase.from('bookings').select('total_price, status, type, created_at'),
        supabase.from('clients').select('status, created_at'),
      ])
      setBookings(b || [])
      setClients(c || [])
      setLoading(false)
    }
    load()
  }, [])

  const period = PERIODS.find(p => p.key === periodKey) || PERIODS[2]

  const rangeStart = useMemo(() => {
    if (period.key === 'custom') return customFrom ? new Date(customFrom + 'T00:00:00') : null
    if (period.months === 0) return null
    const d = new Date()
    d.setDate(1); d.setHours(0, 0, 0, 0)
    if (period.key === '12m') {
      return new Date(d.getFullYear(), 0, 1)
    }
    d.setMonth(d.getMonth() - (period.months - 1))
    return d
  }, [period, customFrom])

  const rangeEnd = useMemo(() => {
    if (period.key === 'custom' && customTo) return new Date(customTo + 'T23:59:59')
    return null
  }, [period, customTo])

  const inRange = (dateStr: string | null) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    if (rangeStart && d < rangeStart) return false
    if (rangeEnd && d > rangeEnd) return false
    return true
  }

  const bookingsInRange = useMemo(() => {
    if (!rangeStart && !rangeEnd) return bookings
    return bookings.filter(b => inRange(b.created_at))
  }, [bookings, rangeStart, rangeEnd])

  const clientsInRange = useMemo(() => {
    if (!rangeStart && !rangeEnd) return clients
    return clients.filter(c => inRange(c.created_at))
  }, [clients, rangeStart, rangeEnd])

  // ---- KPI cards ----
  const revenueBookings = bookingsInRange.filter(b => REVENUE_STATUSES.includes(b.status))
  const totalRevenue = revenueBookings.reduce((s, b) => s + (Number(b.total_price) || 0), 0)
  const totalBookings = bookingsInRange.filter(b => b.status !== 'cancelled').length
  const newLeads = clientsInRange.length
  const avgBookingValue = revenueBookings.length ? totalRevenue / revenueBookings.length : 0

  // ---- Monthly buckets (revenue, bookings, leads) ----
  const monthlyBuckets = useMemo(() => {
    const now = new Date()
    const numMonths = period.key === 'custom'
      ? (() => {
          if (!customFrom) return 6
          const start = new Date(customFrom + 'T00:00:00')
          const end = customTo ? new Date(customTo + 'T00:00:00') : now
          const diff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
          return Math.max(1, Math.min(diff, 24))
        })()
      : period.months === 0
      ? (() => {
          const allDates = [...bookings.map(b => b.created_at), ...clients.map(c => c.created_at)].filter(Boolean).map(d => new Date(d))
          if (allDates.length === 0) return 6
          const earliest = allDates.reduce((a, b) => (a < b ? a : b))
          const diffMonths = (now.getFullYear() - earliest.getFullYear()) * 12 + (now.getMonth() - earliest.getMonth()) + 1
          return Math.max(1, Math.min(diffMonths, 24))
        })()
      : period.key === '12m' ? now.getMonth() + 1 : period.months

    // For custom ranges, anchor the last bucket to customTo (or now)
    const anchor = period.key === 'custom' && customTo ? new Date(customTo + 'T00:00:00') : now
    const buckets: { key: string; label: string; revenue: number; bookings: number; leads: number }[] = []
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1)
      buckets.push({ key: monthKey(d), label: monthLabel(d), revenue: 0, bookings: 0, leads: 0 })
    }
    const byKey: Record<string, typeof buckets[0]> = {}
    buckets.forEach(b => (byKey[b.key] = b))

    bookings.forEach(b => {
      if (!b.created_at) return
      const k = monthKey(new Date(b.created_at))
      if (!byKey[k]) return
      if (b.status !== 'cancelled') byKey[k].bookings += 1
      if (REVENUE_STATUSES.includes(b.status)) byKey[k].revenue += Number(b.total_price) || 0
    })
    clients.forEach(c => {
      if (!c.created_at) return
      const k = monthKey(new Date(c.created_at))
      if (byKey[k]) byKey[k].leads += 1
    })
    return buckets
  }, [bookings, clients, period, customFrom, customTo])

  // ---- Bookings by type ----
  const typeBreakdown = useMemo(() => {
    return BOOKING_TYPES.map(t => ({
      ...t,
      count: bookingsInRange.filter(b => b.type === t.key && b.status !== 'cancelled').length,
    })).filter(t => t.count > 0).sort((a, b) => b.count - a.count)
  }, [bookingsInRange])

  // ---- Status breakdown ----
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    bookingsInRange.forEach(b => { counts[b.status] = (counts[b.status] || 0) + 1 })
    return Object.entries(counts)
      .map(([status, count]) => ({ status, count, label: STATUS_LABELS[status] || status, color: STATUS_COLORS[status] || '#888' }))
      .sort((a, b) => b.count - a.count)
  }, [bookingsInRange])

  const kpiCards = [
    { label: 'Revenue', value: `$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: '#3B6D11', bg: '#EAF3DE' },
    { label: 'Bookings', value: totalBookings, icon: CalendarDays, color: '#854F0B', bg: '#FAEEDA' },
    { label: 'New Leads', value: newLeads, icon: TrendingUp, color: '#0F6E56', bg: '#E1F5EE' },
    { label: 'Avg Booking Value', value: `$${avgBookingValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: Receipt, color: '#185FA5', bg: '#E6F1FB' },
  ]

  if (loading) {
    return <div style={{ padding: 24, color: '#888', fontSize: 13 }}>Loading reports…</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Reports</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Revenue, bookings and lead performance</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {periodKey === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                style={{ padding: '7px 9px', border: '0.5px solid #d0d0d0', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' }} />
              <span style={{ color: '#aaa', fontSize: 12 }}>→</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                style={{ padding: '7px 9px', border: '0.5px solid #d0d0d0', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' }} />
            </div>
          )}
          <select
            value={periodKey}
            onChange={e => setPeriodKey(e.target.value)}
            style={{ padding: '8px 12px', border: '0.5px solid #d0d0d0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fafafa', cursor: 'pointer' }}
          >
            {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {kpiCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ ...card, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
              <div style={{ background: bg, borderRadius: 8, padding: 6 }}><Icon size={16} color={color} /></div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Revenue trend */}
      <div style={{ ...card, marginBottom: 16, overflow: 'hidden' }}>
        <div style={sectionHead}>Revenue by Month</div>
        <div style={{ padding: '12px 16px 4px' }}>
          {monthlyBuckets.every(b => b.revenue === 0) ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No revenue recorded yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyBuckets} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#888' }} axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ borderRadius: 8, border: '0.5px solid #e5e5e5', fontSize: 13 }}
                />
                <Bar dataKey="revenue" fill="#3B6D11" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Bookings & Leads trend */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={sectionHead}>Bookings &amp; New Leads by Month</div>
          <div style={{ padding: '12px 16px 4px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyBuckets} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#888' }} axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '0.5px solid #e5e5e5', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#854F0B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="leads" name="New Leads" stroke="#0F6E56" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings by type */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={sectionHead}>Bookings by Type</div>
          <div style={{ padding: 16 }}>
            {typeBreakdown.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No bookings in this period.</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={typeBreakdown} dataKey="count" nameKey="label" innerRadius={36} outerRadius={64} paddingAngle={2}>
                      {typeBreakdown.map(t => <Cell key={t.key} fill={t.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [value, name]} contentStyle={{ borderRadius: 8, border: '0.5px solid #e5e5e5', fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {typeBreakdown.map(t => {
                    const Icon = t.icon
                    return (
                      <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                        <Icon size={13} color={t.color} />
                        <span style={{ fontSize: 12, flex: 1 }}>{t.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{t.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={sectionHead}>Bookings by Status</div>
        <div style={{ padding: 16 }}>
          {statusBreakdown.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No bookings in this period.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {statusBreakdown.map(s => (
                <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: '#fafafa', border: '0.5px solid #f0f0f0' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 12, color: '#555' }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

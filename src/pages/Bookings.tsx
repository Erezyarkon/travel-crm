import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, BedDouble, Car, Bus, Map, Ticket, UtensilsCrossed, Plane, Shield, Download,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { exportToCsv } from '../lib/exportCsv'

const BOOKING_TYPES: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  hotel:      { label: 'Hotel',      icon: BedDouble,       color: '#185FA5', bg: '#E6F1FB' },
  car_rental: { label: 'Car Rental', icon: Car,             color: '#0F6E56', bg: '#E1F5EE' },
  transfer:   { label: 'Transfer',   icon: Bus,             color: '#854F0B', bg: '#FAEEDA' },
  day_trip:   { label: 'Day Trip',   icon: Map,             color: '#3B6D11', bg: '#EAF3DE' },
  entrance:   { label: 'Entrance',   icon: Ticket,          color: '#534AB7', bg: '#EEEDFE' },
  meals:      { label: 'Meals',      icon: UtensilsCrossed, color: '#993556', bg: '#FBEAF0' },
  flight:     { label: 'Flights',    icon: Plane,           color: '#0C447C', bg: '#B5D4F4' },
  vip:        { label: 'VIP',        icon: Shield,          color: '#B8860B', bg: '#FFF8E6' },
}

const STATUS_INFO: Record<string, { label: string; bg: string; color: string }> = {
  inquiry:      { label: 'Inquiry',      bg: '#F1F1F1', color: '#5F5E5A' },
  quoted:       { label: 'Quoted',       bg: '#FAEEDA', color: '#854F0B' },
  confirmed:    { label: 'Confirmed',    bg: '#E6F1FB', color: '#185FA5' },
  paid:         { label: 'Paid',         bg: '#EAF3DE', color: '#3B6D11' },
  voucher_sent: { label: 'Voucher Sent', bg: '#E1F5EE', color: '#0F6E56' },
  completed:    { label: 'Completed',    bg: '#E1F5EE', color: '#0F6E56' },
  cancelled:    { label: 'Cancelled',    bg: '#FBEAEA', color: '#A32D2D' },
}

const STATUS_ORDER = ['all', 'inquiry', 'quoted', 'confirmed', 'paid', 'voucher_sent', 'completed', 'cancelled']

function fmtDate(d?: string) {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

// A booking can carry its relevant date in different columns depending on type
function bookingDate(b: any): string {
  return b.check_in || b.pickup_date || b.created_at || ''
}

export default function Bookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      // Join client name via FK relationship (bookings.client_id -> clients.id)
      const { data, error } = await supabase
        .from('bookings')
        .select('*, clients(full_name)')
        .order('created_at', { ascending: false })
      if (error) {
        // Fallback if the relationship select isn't available
        const { data: plain } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false })
        setBookings(plain || [])
      } else {
        setBookings(data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return bookings.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false
      if (typeFilter !== 'all' && b.type !== typeFilter) return false
      if (!q) return true
      const clientName = b.clients?.full_name || ''
      return (
        clientName.toLowerCase().includes(q) ||
        b.file_number?.toLowerCase().includes(q) ||
        b.service_name?.toLowerCase().includes(q) ||
        (BOOKING_TYPES[b.type]?.label || '').toLowerCase().includes(q)
      )
    })
  }, [bookings, search, statusFilter, typeFilter])

  const totalValue = filtered
    .filter(b => b.status !== 'cancelled')
    .reduce((s, b) => s + (Number(b.total_price) || 0), 0)

  const typesPresent = useMemo(() => {
    const set = new Set(bookings.map(b => b.type))
    return Object.keys(BOOKING_TYPES).filter(t => set.has(t))
  }, [bookings])

  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px 7px 32px', border: '0.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none' }
  const th: React.CSSProperties = { textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.3 }
  const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13, verticalAlign: 'middle' }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Bookings</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>
            {filtered.length} {filtered.length === 1 ? 'booking' : 'bookings'}
            {totalValue > 0 && <> · ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} total</>}
          </p>
        </div>
        <button onClick={() => exportToCsv('bookings', filtered, [
          { header: 'File Number', value: b => b.file_number },
          { header: 'Client', value: b => b.clients?.full_name || '' },
          { header: 'Type', value: b => BOOKING_TYPES[b.type]?.label || b.type },
          { header: 'Service', value: b => b.service_name },
          { header: 'Date', value: b => { const d = bookingDate(b); return d ? new Date(d).toLocaleDateString('en-GB') : '' } },
          { header: 'Status', value: b => STATUS_INFO[b.status]?.label || b.status },
          { header: 'Price (USD)', value: b => b.total_price || '' },
          { header: 'Deposit Paid', value: b => b.deposit_paid || '' },
        ])} disabled={filtered.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#555', border: '0.5px solid #d0d0d0', borderRadius: 8, padding: '9px 14px', cursor: filtered.length === 0 ? 'default' : 'pointer', fontWeight: 500, fontSize: 13, opacity: filtered.length === 0 ? 0.5 : 1 }}>
          <Download size={15} /> Export
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
        {/* Search + filters */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client, file number, service..." style={inp} />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '7px 10px', border: '0.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer' }}>
              <option value="all">All Types</option>
              {typesPresent.map(t => <option key={t} value={t}>{BOOKING_TYPES[t]?.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_ORDER.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 11px', borderRadius: 20, border: '0.5px solid', fontSize: 12, cursor: 'pointer', fontWeight: statusFilter === s ? 600 : 400, borderColor: statusFilter === s ? '#1a2a3a' : '#e0e0e0', background: statusFilter === s ? '#1a2a3a' : '#fff', color: statusFilter === s ? '#fff' : '#555' }}>
                {s === 'all' ? 'All' : STATUS_INFO[s]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
            <div style={{ fontSize: 15 }}>No bookings found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Bookings are created from inside a client file.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #f0f0f0' }}>
                  <th style={th}>Type</th>
                  <th style={th}>Service</th>
                  <th style={th}>Client</th>
                  <th style={th}>File #</th>
                  <th style={th}>Date</th>
                  <th style={{ ...th, textAlign: 'right' }}>Price</th>
                  <th style={{ ...th, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const bt = BOOKING_TYPES[b.type] || { label: b.type, icon: Ticket, color: '#888', bg: '#f0f0f0' }
                  const Icon = bt.icon
                  const st = STATUS_INFO[b.status] || { label: b.status, bg: '#f0f0f0', color: '#888' }
                  return (
                    <tr
                      key={b.id}
                      onClick={() => b.client_id && navigate(`/clients/${b.client_id}`)}
                      style={{ borderBottom: '0.5px solid #f8f8f8', cursor: b.client_id ? 'pointer' : 'default' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ background: bt.bg, borderRadius: 7, padding: 5, display: 'flex' }}>
                            <Icon size={14} color={bt.color} />
                          </div>
                          <span style={{ fontSize: 12, color: '#555' }}>{bt.label}</span>
                        </div>
                      </td>
                      <td style={{ ...td, fontWeight: 500 }}>{b.service_name || '—'}</td>
                      <td style={td}>{b.clients?.full_name || <span style={{ color: '#bbb' }}>—</span>}</td>
                      <td style={{ ...td, color: '#888' }}>{b.file_number}</td>
                      <td style={{ ...td, color: '#888' }}>{fmtDate(bookingDate(b))}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>
                        {b.total_price ? `$${Number(b.total_price).toLocaleString()}` : '—'}
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

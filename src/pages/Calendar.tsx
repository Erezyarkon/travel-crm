import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, BedDouble, Car, Bus, Map, Ticket,
  UtensilsCrossed, Plane, Shield, CalendarDays, LogOut, LogIn,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// An "event" is one start or end of a booking on a given day.
interface CalEvent {
  bookingId: string
  clientId: string
  type: string
  service: string
  client: string
  kind: 'start' | 'end'
}

export default function Calendar() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [eventsByDay, setEventsByDay] = useState<Record<string, CalEvent[]>>({})
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  useEffect(() => {
    async function load() {
      if (!profile) return
      setLoading(true)
      const isAgent = profile.role === 'agent'

      // Limit to current month's window (+/- to catch ranges spanning the edges)
      const from = new Date(year, month - 1, 1)
      const to = new Date(year, month + 2, 0)

      // Agents: restrict to their own clients
      let clientIds: string[] | null = null
      if (isAgent) {
        const { data: cs } = await supabase.from('clients').select('id').eq('owner_id', profile.id)
        clientIds = (cs || []).map(c => c.id)
        if (clientIds.length === 0) { setEventsByDay({}); setLoading(false); return }
      }

      let q = supabase.from('bookings')
        .select('id, client_id, service_name, type, status, check_in, check_out, pickup_date, return_date, clients(full_name)')
        .neq('status', 'cancelled')
      if (clientIds) q = q.in('client_id', clientIds)
      const { data } = await q

      const map: Record<string, CalEvent[]> = {}
      const add = (dateStr: string | null, ev: CalEvent) => {
        if (!dateStr) return
        const key = dateStr.slice(0, 10)
        if (!map[key]) map[key] = []
        map[key].push(ev)
      }
      ;(data || []).forEach((b: any) => {
        const base = { bookingId: b.id, clientId: b.client_id, type: b.type, service: b.service_name || BOOKING_TYPES[b.type]?.label || 'Booking', client: b.clients?.full_name || '' }
        const start = b.check_in || b.pickup_date
        const end = b.check_out || b.return_date
        add(start, { ...base, kind: 'start' })
        if (end && end !== start) add(end, { ...base, kind: 'end' })
      })
      setEventsByDay(map)
      setLoading(false)
    }
    load()
  }, [profile, year, month])

  // Build the grid: leading blanks + days of month
  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const arr: (Date | null)[] = []
    for (let i = 0; i < firstWeekday; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d))
    while (arr.length % 7 !== 0) arr.push(null)
    return arr
  }, [year, month])

  const todayStr = ymd(new Date())
  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] || []) : []

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Calendar</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Trips, check-ins and departures</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} style={navBtn}><ChevronLeft size={16} /></button>
          <div style={{ fontSize: 15, fontWeight: 600, minWidth: 150, textAlign: 'center' }}>{MONTHS[month]} {year}</div>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} style={navBtn}><ChevronRight size={16} /></button>
          <button onClick={() => { const d = new Date(); d.setDate(1); setCursor(d) }} style={{ ...navBtn, width: 'auto', padding: '0 12px', fontSize: 12, fontWeight: 600 }}>Today</button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
        {/* Weekday header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '0.5px solid #f0f0f0' }}>
          {WEEKDAYS.map(w => (
            <div key={w} style={{ padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.3 }}>{w}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 50, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((date, i) => {
              if (!date) return <div key={i} style={{ minHeight: 96, background: '#fcfcfc', borderRight: '0.5px solid #f5f5f5', borderBottom: '0.5px solid #f5f5f5' }} />
              const key = ymd(date)
              const evs = eventsByDay[key] || []
              const isToday = key === todayStr
              const isSelected = key === selectedDay
              return (
                <div key={i} onClick={() => setSelectedDay(isSelected ? null : key)}
                  style={{ minHeight: 96, padding: 6, borderRight: '0.5px solid #f5f5f5', borderBottom: '0.5px solid #f5f5f5', cursor: 'pointer', background: isSelected ? '#f5f8fb' : '#fff', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? '#fff' : '#555', background: isToday ? '#185FA5' : 'transparent', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{date.getDate()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                    {evs.slice(0, 3).map((ev, j) => {
                      const bt = BOOKING_TYPES[ev.type] || { color: '#888', bg: '#f0f0f0' }
                      return (
                        <div key={j} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: bt.bg, color: bt.color, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
                          {ev.kind === 'end' ? <LogOut size={8} /> : <LogIn size={8} />}
                          {ev.client || ev.service}
                        </div>
                      )
                    })}
                    {evs.length > 3 && <div style={{ fontSize: 9, color: '#999', paddingLeft: 4 }}>+{evs.length - 3} more</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div style={{ marginTop: 16, background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={15} color="#185FA5" />
            {new Date(selectedDay).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          {selectedEvents.length === 0 ? (
            <div style={{ padding: 22, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Nothing scheduled this day.</div>
          ) : selectedEvents.map((ev, i) => {
            const bt = BOOKING_TYPES[ev.type] || { label: ev.type, icon: Ticket, color: '#888', bg: '#f0f0f0' }
            const Icon = bt.icon
            return (
              <div key={i} onClick={() => ev.clientId && navigate(`/clients/${ev.clientId}`)}
                style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', borderBottom: '0.5px solid #f8f8f8' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ background: bt.bg, borderRadius: 8, padding: 7, flexShrink: 0 }}><Icon size={15} color={bt.color} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{ev.service}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{ev.client}</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 20, background: ev.kind === 'end' ? '#FBEAEA' : '#E1F5EE', color: ev.kind === 'end' ? '#A32D2D' : '#0F6E56', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {ev.kind === 'end' ? <><LogOut size={10} /> Check-out</> : <><LogIn size={10} /> Check-in</>}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: '0.5px solid #e0e0e0', background: '#fff',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555',
}

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, BedDouble, Car, Bus, Map, Ticket, UtensilsCrossed, Plane, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'

const BOOKING_TYPES = [
  { key: 'hotel',     label: 'Hotel',      icon: BedDouble,       color: '#185FA5', bg: '#E6F1FB' },
  { key: 'car_rental',label: 'Car Rental', icon: Car,             color: '#0F6E56', bg: '#E1F5EE' },
  { key: 'transfer',  label: 'Transfer',   icon: Bus,             color: '#854F0B', bg: '#FAEEDA' },
  { key: 'day_trip',  label: 'Day Trip',   icon: Map,             color: '#3B6D11', bg: '#EAF3DE' },
  { key: 'entrance',  label: 'Entrance',   icon: Ticket,          color: '#534AB7', bg: '#EEEDFE' },
  { key: 'meals',     label: 'Meals',      icon: UtensilsCrossed, color: '#993556', bg: '#FBEAF0' },
  { key: 'flight',    label: 'Flights',    icon: Plane,           color: '#0C447C', bg: '#B5D4F4' },
  { key: 'visa',      label: 'Visa',       icon: FileText,        color: '#993C1D', bg: '#FAECE7' },
]

const STATUS_STEPS = ['inquiry','quoted','confirmed','paid','voucher_sent','completed']
const STATUS_LABELS: Record<string,string> = {
  inquiry:'Inquiry', quoted:'Quoted', confirmed:'Confirmed',
  paid:'Paid', voucher_sent:'Voucher Sent', completed:'Completed', cancelled:'Cancelled'
}

export default function ClientCard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<any>(null)
  const [travelers, setTravelers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [activeType, setActiveType] = useState('hotel')
  const [showNewBooking, setShowNewBooking] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: tr }, { data: b }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id).single(),
        supabase.from('travelers').select('*').eq('client_id', id),
        supabase.from('bookings').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      ])
      setClient(c); setTravelers(tr || []); setBookings(b || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Loading...</div>
  if (!client) return <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Client not found</div>

  const activeBookings = bookings.filter(b => b.type === activeType)
  const initials = client.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
  const allTravelers = [
    { full_name: client.full_name, is_lead: true, type: 'adult', passport_number: client.passport_number, nationality: client.nationality, date_of_birth: client.date_of_birth, gender: client.gender },
    ...travelers
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => navigate('/clients')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <ArrowLeft size={16} /> Clients
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        {/* CLIENT CARD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
            <div style={{ background: '#1a2a3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#185FA5', flexShrink: 0 }}>{initials}</div>
              <div>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{client.full_name}</div>
                <div style={{ color: '#7899bb', fontSize: 11, marginTop: 2 }}>File {client.file_number}</div>
              </div>
            </div>
            <div style={{ padding: 14 }}>
              {[
                ['Phone', client.phone],
                ['Email', client.email],
                ['Passport', client.passport_number],
                ['Date of Birth', client.date_of_birth],
                ['Nationality', client.nationality],
                ['Preferences', client.preferences],
              ].filter(([,v]) => v).map(([label, val]) => (
                <div key={label} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: '#aaa', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#333', background: '#fafafa', borderRadius: 6, padding: '4px 8px', border: '0.5px solid #eee' }}>{val}</div>
                </div>
              ))}
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: client.status === 'lead' ? '#E1F5EE' : client.status === 'active' ? '#E6F1FB' : '#F1EFE8', color: client.status === 'lead' ? '#0F6E56' : client.status === 'active' ? '#185FA5' : '#5F5E5A', fontWeight: 500 }}>
                  {client.status === 'lead' ? 'Lead' : client.status === 'active' ? 'Active' : 'Past'}
                </span>
              </div>
            </div>
          </div>

          {/* TRAVELERS */}
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Travelers ({allTravelers.length})</span>
              <button style={{ fontSize: 10, color: '#0F6E56', background: '#E1F5EE', border: '0.5px solid #5DCAA5', borderRadius: 20, padding: '2px 8px', cursor: 'pointer' }}>+ Add</button>
            </div>
            {allTravelers.map((tr, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: '#fafafa', borderRadius: 8, marginBottom: 5, border: '0.5px solid #eee' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: i === 0 ? '#1a2a3a' : '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: i === 0 ? '#fff' : '#185FA5', fontWeight: 600 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{tr.full_name}</div>
                  <div style={{ fontSize: 10, color: '#888' }}>{tr.is_lead ? 'Lead' : tr.type === 'child' ? `Child · Age ${tr.age}` : 'Adult'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Booking type tabs */}
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Booking Type</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
              {BOOKING_TYPES.map(({ key, label, icon: Icon, color, bg }) => (
                <button key={key} onClick={() => { setActiveType(key); setShowNewBooking(false) }}
                  style={{ border: activeType === key ? `2px solid ${color}` : '0.5px solid #e5e5e5', borderRadius: 10, padding: '8px 4px', textAlign: 'center', cursor: 'pointer', background: activeType === key ? bg : '#fff', transition: 'all 0.15s' }}>
                  <Icon size={18} color={activeType === key ? color : '#aaa'} style={{ display: 'block', margin: '0 auto 4px' }} />
                  <span style={{ fontSize: 9, color: activeType === key ? color : '#888', fontWeight: activeType === key ? 600 : 400 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bookings panel */}
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{BOOKING_TYPES.find(b => b.key === activeType)?.label} Bookings</span>
              <button onClick={() => setShowNewBooking(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                <Plus size={13} /> New Booking
              </button>
            </div>

            {showNewBooking && (
              <BookingForm
                type={activeType} clientId={id!} fileNumber={client.file_number}
                travelers={allTravelers}
                onSave={async (b: any) => {
                  const { data } = await supabase.from('bookings').insert(b).select().single()
                  if (data) { setBookings(bk => [data, ...bk]); setShowNewBooking(false) }
                }}
                onCancel={() => setShowNewBooking(false)}
              />
            )}

            {activeBookings.length === 0 && !showNewBooking ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#aaa', fontSize: 13 }}>
                No {BOOKING_TYPES.find(b => b.key === activeType)?.label} bookings yet. Click "New Booking" to add one.
              </div>
            ) : activeBookings.map(b => (
              <BookingRow key={b.id} booking={b}
                onStatusChange={async (newStatus: string) => {
                  await supabase.from('bookings').update({ status: newStatus }).eq('id', b.id)
                  setBookings(bks => bks.map(bk => bk.id === b.id ? { ...bk, status: newStatus } : bk))
                }}
              />
            ))}
          </div>

          {/* All bookings summary */}
          {bookings.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>All Bookings in File</span>
              </div>
              {bookings.map(b => {
                const bt = BOOKING_TYPES.find(bt => bt.key === b.type)
                return (
                  <div key={b.id} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '0.5px solid #f8f8f8' }}>
                    {bt && <div style={{ background: bt.bg, borderRadius: 8, padding: 6 }}><bt.icon size={14} color={bt.color} /></div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{b.service_name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{b.check_in || b.pickup_date || b.date} · ${b.total_price}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f0f0f0', color: '#555', fontWeight: 500 }}>
                      {STATUS_LABELS[b.status] || b.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BookingRow({ booking: b, onStatusChange }: { booking: any; onStatusChange: (s: string) => void }) {
  const stepIdx = STATUS_STEPS.indexOf(b.status)
  return (
    <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{b.service_name}</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            {b.check_in || b.pickup_date || b.date}
            {(b.check_out || b.return_date) ? ` → ${b.check_out || b.return_date}` : ''}
            {' · '}{b.num_travelers} travelers
          </div>
          {b.supplier_confirmation && <div style={{ fontSize: 10, color: '#0F6E56', marginTop: 2 }}>Ref: {b.supplier_confirmation}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>${b.total_price}</div>
          <div style={{ fontSize: 10, color: '#3B6D11' }}>Deposit: ${b.deposit_paid}</div>
          <div style={{ fontSize: 10, color: '#854F0B' }}>Balance: ${(b.total_price - b.deposit_paid).toFixed(2)}</div>
        </div>
      </div>
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        {STATUS_STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, border: `1.5px solid ${i <= stepIdx ? '#1D9E75' : '#ddd'}`, background: i < stepIdx ? '#1D9E75' : i === stepIdx ? '#E1F5EE' : '#fff', color: i < stepIdx ? '#fff' : i === stepIdx ? '#0F6E56' : '#aaa' }}>
                {i < stepIdx ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: 8, color: i <= stepIdx ? '#0F6E56' : '#aaa', marginTop: 2, textAlign: 'center', whiteSpace: 'nowrap' }}>{STATUS_LABELS[s]}</div>
            </div>
            {i < STATUS_STEPS.length - 1 && <div style={{ flex: 1, height: 1.5, background: i < stepIdx ? '#1D9E75' : '#eee', marginBottom: 14 }} />}
          </React.Fragment>
        ))}
      </div>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {b.status === 'inquiry'      && <Abtn label="Confirm Quote"   color="#185FA5" bg="#E6F1FB" onClick={() => onStatusChange('quoted')} />}
        {b.status === 'quoted'       && <Abtn label="Confirm Booking" color="#0F6E56" bg="#E1F5EE" onClick={() => onStatusChange('confirmed')} />}
        {b.status === 'confirmed'    && <Abtn label="Mark as Paid"    color="#3B6D11" bg="#EAF3DE" onClick={() => onStatusChange('paid')} />}
        {b.status === 'paid'         && <Abtn label="Send Voucher"    color="#534AB7" bg="#EEEDFE" onClick={() => onStatusChange('voucher_sent')} />}
        {b.status === 'voucher_sent' && <Abtn label="Complete"        color="#0F6E56" bg="#E1F5EE" onClick={() => onStatusChange('completed')} />}
        {!['completed','cancelled'].includes(b.status) && <Abtn label="Cancel" color="#A32D2D" bg="#FCEBEB" onClick={() => onStatusChange('cancelled')} />}
        {b.notes && <span style={{ fontSize: 11, color: '#888', alignSelf: 'center' }}>📝 {b.notes}</span>}
      </div>
    </div>
  )
}

function Abtn({ label, color, bg, onClick }: { label: string; color: string; bg: string; onClick: () => void }) {
  return <button onClick={onClick} style={{ padding: '5px 12px', background: bg, color, border: `0.5px solid ${color}44`, borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>{label}</button>
}

function BookingForm({ type, clientId, fileNumber, travelers, onSave, onCancel }: any) {
  const inp: React.CSSProperties = { width: '100%', padding: '6px 8px', border: '0.5px solid #d0d0d0', borderRadius: 6, fontSize: 12, outline: 'none', background: '#fafafa', color: '#1a1a1a' }
  const lbl: React.CSSProperties = { fontSize: 10, color: '#555', fontWeight: 500, display: 'block', marginBottom: 3 }
  const pre: React.CSSProperties = { ...inp, background: '#E1F5EE', borderColor: '#5DCAA5', color: '#085041' }
  const g3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }
  const g2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }

  const lead = travelers.find((t: any) => t.is_lead) || travelers[0]
  const adults = travelers.filter((t: any) => t.type !== 'child')
  const children = travelers.filter((t: any) => t.type === 'child')

  const [f, setF] = useState<any>({
    service_name: '', check_in: '', check_out: '', pickup_date: '', return_date: '', date: '',
    num_travelers: travelers.length, total_price: '', deposit_paid: '0', supplier_confirmation: '', notes: '',
    city: '', country: '', room_type: 'Deluxe Double', meal_plan: 'BB', nights: '', view_type: 'No preference',
    num_rooms: '1', extra_bed: 'None', payment_supplier: 'Credit card', cancellation_policy: 'Free cancellation',
    occupancy: '2 Adults',
    car_type: 'Compact', rental_company: '', pickup_location: '', return_location: '', insurance: 'Full', days: '',
    from: '', to: '', flight_number: '', vehicle_type: 'Minibus', transfer_time: '',
    meeting_point: '', meeting_time: '', guide: '',
    site_name: '', price_adult: '', price_child: '',
    restaurant: '', meal_type: 'Dinner', dietary: '',
    airline: '', flight_no: '', origin: '', destination: '', departure_time: '', arrival_time: '', cabin_class: 'Economy', baggage: '', pnr: '',
    visa_type: 'Tourist', visa_country: '', submission_date: '', collection_date: '', embassy: '',
  })
  const s = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }))

  const calcNights = (ci: string, co: string) => {
    if (ci && co) { const d = Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000); s('nights', d > 0 ? String(d) : '0') }
  }

  const autoPrice = () => {
    const a = adults.length, c = children.length
    const ap = parseFloat(f.price_adult) || 0, cp = parseFloat(f.price_child) || 0
    const total = (a * ap) + (c * cp)
    if (total > 0) s('total_price', String(total))
  }

  const GuestBox = ({ color, label, rows }: { color: string; label: string; rows: string[] }) => (
    <div style={{ background: color === 'blue' ? '#E6F1FB' : color === 'green' ? '#E1F5EE' : color === 'purple' ? '#EEEDFE' : color === 'pink' ? '#FBEAF0' : '#B5D4F4', border: `0.5px solid ${color === 'blue' ? '#85B7EB' : color === 'green' ? '#5DCAA5' : color === 'purple' ? '#AFA9EC' : color === 'pink' ? '#ED93B1' : '#6AAAE0'}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: color === 'blue' ? '#0C447C' : color === 'green' ? '#085041' : color === 'purple' ? '#3C3489' : color === 'pink' ? '#6B2340' : '#0C447C', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
        🔒 {label}
      </div>
      {rows.map((r, i) => <div key={i} style={{ fontSize: 11, color: color === 'blue' ? '#0C447C' : color === 'green' ? '#085041' : color === 'purple' ? '#3C3489' : color === 'pink' ? '#6B2340' : '#0C447C', padding: '1px 0' }}>{r}</div>)}
    </div>
  )

  return (
    <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '0.5px solid #e5e5e5' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#1a2a3a' }}>
        New Booking — {BOOKING_TYPES.find(b => b.key === type)?.label}
      </div>

      {/* ── HOTEL ── */}
      {type === 'hotel' && <>
        <div style={g3}>
          <div><label style={lbl}>Hotel Name</label><input style={inp} value={f.service_name} onChange={e => s('service_name', e.target.value)} placeholder="Hotel name" /></div>
          <div><label style={lbl}>City / Destination</label><input style={inp} value={f.city} onChange={e => s('city', e.target.value)} placeholder="Jerusalem, Cairo..." /></div>
          <div><label style={lbl}>Country</label><input style={inp} value={f.country} onChange={e => s('country', e.target.value)} placeholder="Israel, Egypt..." /></div>
        </div>
        <div style={g3}>
          <div><label style={lbl}>Check-in</label><input type="date" style={inp} value={f.check_in} onChange={e => { s('check_in', e.target.value); calcNights(e.target.value, f.check_out) }} /></div>
          <div><label style={lbl}>Check-out</label><input type="date" style={inp} value={f.check_out} onChange={e => { s('check_out', e.target.value); calcNights(f.check_in, e.target.value) }} /></div>
          <div><label style={lbl}>Nights</label><input style={{ ...inp, background: '#E6F1FB', borderColor: '#85B7EB', color: '#0C447C', fontWeight: 500 }} value={f.nights ? `${f.nights} nights` : ''} readOnly /></div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={lbl}>Room Occupancy</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {['1 Adult','2 Adults','1 Adult + 1 Child','2 Adults + 1 Child','2 Adults + 2 Children','Custom'].map(opt => (
              <button key={opt} onClick={() => s('occupancy', opt)} style={{ border: f.occupancy === opt ? '2px solid #185FA5' : '0.5px solid #ddd', borderRadius: 8, padding: '7px 4px', cursor: 'pointer', background: f.occupancy === opt ? '#E6F1FB' : '#fff', fontSize: 11, color: f.occupancy === opt ? '#0C447C' : '#555', fontWeight: f.occupancy === opt ? 500 : 400 }}>{opt}</button>
            ))}
          </div>
        </div>
        <div style={g3}>
          <div><label style={lbl}>Room Type</label>
            <select style={inp} value={f.room_type} onChange={e => s('room_type', e.target.value)}>
              {['Standard Double','Deluxe Double','Twin','Triple','Suite','Junior Suite','Family Room'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div><label style={lbl}>View</label>
            <select style={inp} value={f.view_type} onChange={e => s('view_type', e.target.value)}>
              {['No preference','Sea view','Garden view','City view','Pool view','Mountain view'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div><label style={lbl}>No. of Rooms</label><input type="number" min="1" style={inp} value={f.num_rooms} onChange={e => s('num_rooms', e.target.value)} /></div>
        </div>
        <div style={g3}>
          <div><label style={lbl}>Meal Plan</label>
            <select style={inp} value={f.meal_plan} onChange={e => s('meal_plan', e.target.value)}>
              {['RO – Room only','BB – Bed & Breakfast','HB – Half Board','FB – Full Board','AI – All Inclusive'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Extra Bed / Crib</label>
            <select style={inp} value={f.extra_bed} onChange={e => s('extra_bed', e.target.value)}>
              {['None','Extra bed','Baby crib','Extra bed + crib'].map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Payment to Supplier</label>
            <select style={inp} value={f.payment_supplier} onChange={e => s('payment_supplier', e.target.value)}>
              {['Credit card','Bank transfer','Cash on arrival','Voucher','Net rate'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <GuestBox color="green" label="Guests — auto-transferred from client file" rows={travelers.map((t: any, i: number) => `${i+1}. ${t.full_name} · ${t.type === 'child' ? `Child, Age ${t.age}` : 'Adult'}${t.passport_number ? ` · ${t.passport_number}` : ''}${t.nationality ? ` · ${t.nationality}` : ''}`)} />
      </>}

      {/* ── CAR RENTAL ── */}
      {type === 'car_rental' && <>
        <GuestBox color="green" label="Lead driver — auto-transferred" rows={[`${lead?.full_name} · ${lead?.passport_number || ''} · ${lead?.nationality || ''}`]} />
        <div style={g3}>
          <div><label style={lbl}>Rental Company</label><input style={inp} value={f.service_name} onChange={e => s('service_name', e.target.value)} placeholder="Hertz, Avis, Budget..." /></div>
          <div><label style={lbl}>Car Type</label>
            <select style={inp} value={f.car_type} onChange={e => s('car_type', e.target.value)}>
              {['Economy','Compact','SUV','Sedan','Minivan','Luxury','4x4','Convertible'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Insurance</label>
            <select style={inp} value={f.insurance} onChange={e => s('insurance', e.target.value)}>
              {['Full','Basic','Third party','None'].map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
        </div>
        <div style={g3}>
          <div><label style={lbl}>Pickup Date</label><input type="date" style={inp} value={f.pickup_date} onChange={e => s('pickup_date', e.target.value)} /></div>
          <div><label style={lbl}>Return Date</label><input type="date" style={inp} value={f.return_date} onChange={e => s('return_date', e.target.value)} /></div>
          <div><label style={lbl}>No. of Days</label><input type="number" style={inp} value={f.days} onChange={e => s('days', e.target.value)} /></div>
        </div>
        <div style={g2}>
          <div><label style={lbl}>Pickup Location</label><input style={inp} value={f.pickup_location} onChange={e => s('pickup_location', e.target.value)} placeholder="Airport, Hotel name..." /></div>
          <div><label style={lbl}>Return Location</label><input style={inp} value={f.return_location} onChange={e => s('return_location', e.target.value)} placeholder="Same or different..." /></div>
        </div>
        <div style={g2}>
          <div><label style={lbl}>Payment to Supplier</label>
            <select style={inp} value={f.payment_supplier} onChange={e => s('payment_supplier', e.target.value)}>
              {['Credit card','Bank transfer','Cash on arrival','Voucher'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Cancellation Policy</label>
            <select style={inp} value={f.cancellation_policy} onChange={e => s('cancellation_policy', e.target.value)}>
              {['Free cancellation','Non-refundable','48h free cancel','Custom'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </>}

      {/* ── TRANSFER ── */}
      {type === 'transfer' && <>
        <GuestBox color="blue" label="Lead passenger + group size — auto-transferred" rows={[`${lead?.full_name} · ${travelers.length} travelers · ${lead?.phone || ''}`]} />
        <div style={g3}>
          <div><label style={lbl}>From</label><input style={inp} value={f.from} onChange={e => { s('from', e.target.value); s('service_name', `Transfer: ${e.target.value} → ${f.to}`) }} placeholder="Airport, Hotel..." /></div>
          <div><label style={lbl}>To</label><input style={inp} value={f.to} onChange={e => { s('to', e.target.value); s('service_name', `Transfer: ${f.from} → ${e.target.value}`) }} placeholder="Hotel, City..." /></div>
          <div><label style={lbl}>Vehicle Type</label>
            <select style={inp} value={f.vehicle_type} onChange={e => s('vehicle_type', e.target.value)}>
              {['Sedan','SUV','Minibus','Van','Bus','Luxury sedan','Sprinter'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div style={g3}>
          <div><label style={lbl}>Date</label><input type="date" style={inp} value={f.pickup_date} onChange={e => s('pickup_date', e.target.value)} /></div>
          <div><label style={lbl}>Time</label><input type="time" style={inp} value={f.transfer_time} onChange={e => s('transfer_time', e.target.value)} /></div>
          <div><label style={lbl}>Flight No. (if airport)</label><input style={inp} value={f.flight_number} onChange={e => s('flight_number', e.target.value)} placeholder="LY001, EK123..." /></div>
        </div>
        <div style={g2}>
          <div><label style={lbl}>No. of Passengers</label><input style={pre} value={travelers.length} readOnly /></div>
          <div><label style={lbl}>Payment to Supplier</label>
            <select style={inp} value={f.payment_supplier} onChange={e => s('payment_supplier', e.target.value)}>
              {['Credit card','Cash','Bank transfer','Voucher'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </>}

      {/* ── DAY TRIP ── */}
      {type === 'day_trip' && <>
        <GuestBox color="green" label="All travelers — auto-transferred with child ages for pricing" rows={travelers.map((t: any, i: number) => `${i+1}. ${t.full_name} · ${t.type === 'child' ? `Child, Age ${t.age}` : 'Adult'}`)} />
        <div style={g3}>
          <div><label style={lbl}>Trip Name / Destination</label><input style={inp} value={f.service_name} onChange={e => s('service_name', e.target.value)} placeholder="Dead Sea, Petra, Pyramids..." /></div>
          <div><label style={lbl}>Date</label><input type="date" style={inp} value={f.pickup_date} onChange={e => s('pickup_date', e.target.value)} /></div>
          <div><label style={lbl}>Guide Name</label><input style={inp} value={f.guide} onChange={e => s('guide', e.target.value)} placeholder="Guide / company name" /></div>
        </div>
        <div style={g3}>
          <div><label style={lbl}>Meeting Point</label><input style={inp} value={f.meeting_point} onChange={e => s('meeting_point', e.target.value)} placeholder="Hotel lobby, Square..." /></div>
          <div><label style={lbl}>Meeting Time</label><input type="time" style={inp} value={f.meeting_time} onChange={e => s('meeting_time', e.target.value)} /></div>
          <div><label style={lbl}>Payment to Supplier</label>
            <select style={inp} value={f.payment_supplier} onChange={e => s('payment_supplier', e.target.value)}>
              {['Credit card','Cash','Bank transfer','Voucher'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </>}

      {/* ── ENTRANCE ── */}
      {type === 'entrance' && <>
        <GuestBox color="purple" label="Adults & children — auto-transferred for pricing" rows={[`${adults.length} Adults · ${children.length} Children${children.length > 0 ? ` (Ages: ${children.map((c: any) => c.age).join(', ')})` : ''} · Nationality: ${lead?.nationality || ''}`]} />
        <div style={g3}>
          <div><label style={lbl}>Site / Attraction Name</label><input style={inp} value={f.service_name} onChange={e => s('service_name', e.target.value)} placeholder="Masada, Petra, Louvre..." /></div>
          <div><label style={lbl}>Date</label><input type="date" style={inp} value={f.pickup_date} onChange={e => s('pickup_date', e.target.value)} /></div>
          <div><label style={lbl}>Nationality</label><input style={pre} value={lead?.nationality || ''} readOnly /></div>
        </div>
        <div style={g3}>
          <div><label style={lbl}>Adults</label><input style={pre} value={adults.length} readOnly /></div>
          <div><label style={lbl}>Children</label><input style={pre} value={children.length} readOnly /></div>
          <div><label style={lbl}>Children Ages</label><input style={pre} value={children.map((c: any) => c.age).join(', ') || '—'} readOnly /></div>
        </div>
        <div style={g3}>
          <div><label style={lbl}>Adult Price ($)</label><input type="number" style={inp} value={f.price_adult} onChange={e => { s('price_adult', e.target.value); setTimeout(autoPrice, 0) }} /></div>
          <div><label style={lbl}>Child Price ($)</label><input type="number" style={inp} value={f.price_child} onChange={e => { s('price_child', e.target.value); setTimeout(autoPrice, 0) }} /></div>
          <div><label style={lbl}>Ticket Type</label>
            <select style={inp}>
              {['General admission','Guided tour','Skip the line','VIP','Group rate'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </>}

      {/* ── MEALS ── */}
      {type === 'meals' && <>
        <GuestBox color="pink" label="All diners — auto-transferred" rows={travelers.map((t: any, i: number) => `${i+1}. ${t.full_name} · ${t.type === 'child' ? 'Child' : 'Adult'}`)} />
        <div style={g3}>
          <div><label style={lbl}>Restaurant Name</label><input style={inp} value={f.service_name} onChange={e => s('service_name', e.target.value)} /></div>
          <div><label style={lbl}>Date</label><input type="date" style={inp} value={f.pickup_date} onChange={e => s('pickup_date', e.target.value)} /></div>
          <div><label style={lbl}>Meal Type</label>
            <select style={inp} value={f.meal_type} onChange={e => s('meal_type', e.target.value)}>
              {['Breakfast','Lunch','Dinner','Brunch','Cocktail dinner'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={g3}>
          <div><label style={lbl}>No. of Diners</label><input style={pre} value={travelers.length} readOnly /></div>
          <div><label style={lbl}>Dietary Requirements</label><input style={inp} value={f.dietary} onChange={e => s('dietary', e.target.value)} placeholder="Vegetarian, Halal, Kosher..." /></div>
          <div><label style={lbl}>Payment to Supplier</label>
            <select style={inp} value={f.payment_supplier} onChange={e => s('payment_supplier', e.target.value)}>
              {['Credit card','Cash','Voucher','Bank transfer'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </>}

      {/* ── FLIGHT ── */}
      {type === 'flight' && <>
        <GuestBox color="flight" label="All passengers — auto-transferred with passport details" rows={travelers.map((t: any, i: number) => `${i+1}. ${t.full_name}${t.passport_number ? ` · ${t.passport_number}` : ''}${t.date_of_birth ? ` · ${t.date_of_birth}` : ''}${t.nationality ? ` · ${t.nationality}` : ''}`)} />
        <div style={g3}>
          <div><label style={lbl}>Airline</label><input style={inp} value={f.airline} onChange={e => { s('airline', e.target.value); s('service_name', `${e.target.value} ${f.flight_no}`) }} placeholder="El Al, Emirates..." /></div>
          <div><label style={lbl}>Flight No.</label><input style={inp} value={f.flight_no} onChange={e => { s('flight_no', e.target.value); s('service_name', `${f.airline} ${e.target.value}`) }} placeholder="LY001" /></div>
          <div><label style={lbl}>PNR / Booking ref.</label><input style={inp} value={f.pnr} onChange={e => { s('pnr', e.target.value); s('supplier_confirmation', e.target.value) }} /></div>
        </div>
        <div style={g3}>
          <div><label style={lbl}>Origin</label><input style={inp} value={f.origin} onChange={e => s('origin', e.target.value)} placeholder="TLV" /></div>
          <div><label style={lbl}>Destination</label><input style={inp} value={f.destination} onChange={e => s('destination', e.target.value)} placeholder="JFK, CDG..." /></div>
          <div><label style={lbl}>Cabin Class</label>
            <select style={inp} value={f.cabin_class} onChange={e => s('cabin_class', e.target.value)}>
              {['Economy','Premium Economy','Business','First'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={g3}>
          <div><label style={lbl}>Departure</label><input type="datetime-local" style={inp} value={f.departure_time} onChange={e => { s('departure_time', e.target.value); s('pickup_date', e.target.value.split('T')[0]) }} /></div>
          <div><label style={lbl}>Arrival</label><input type="datetime-local" style={inp} value={f.arrival_time} onChange={e => s('arrival_time', e.target.value)} /></div>
          <div><label style={lbl}>Baggage</label><input style={inp} value={f.baggage} onChange={e => s('baggage', e.target.value)} placeholder="20kg, 1 piece..." /></div>
        </div>
      </>}

      {/* ── VISA ── */}
      {type === 'visa' && <>
        <GuestBox color="flight" label="All applicants — auto-transferred with full passport details" rows={travelers.map((t: any, i: number) => `${i+1}. ${t.full_name}${t.passport_number ? ` · ${t.passport_number}` : ''}${t.date_of_birth ? ` · ${t.date_of_birth}` : ''}${t.nationality ? ` · ${t.nationality}` : ''}`)} />
        <div style={g3}>
          <div><label style={lbl}>Visa For (Country)</label><input style={inp} value={f.service_name} onChange={e => { s('service_name', `Visa: ${e.target.value}`); s('visa_country', e.target.value) }} placeholder="USA, Schengen, UK..." /></div>
          <div><label style={lbl}>Visa Type</label>
            <select style={inp} value={f.visa_type} onChange={e => s('visa_type', e.target.value)}>
              {['Tourist','Business','Transit','Student','Work','Family','Medical'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Embassy / Consulate</label><input style={inp} value={f.embassy} onChange={e => s('embassy', e.target.value)} /></div>
        </div>
        <div style={g2}>
          <div><label style={lbl}>Submission Date</label><input type="date" style={inp} value={f.submission_date} onChange={e => { s('submission_date', e.target.value); s('pickup_date', e.target.value) }} /></div>
          <div><label style={lbl}>Collection Date</label><input type="date" style={inp} value={f.collection_date} onChange={e => { s('collection_date', e.target.value); s('return_date', e.target.value) }} /></div>
        </div>
      </>}

      {/* COMMON BOTTOM */}
      <div style={{ ...g3, marginTop: 10 }}>
        <div><label style={lbl}>Total Price ($)</label><input type="number" style={inp} value={f.total_price} onChange={e => s('total_price', e.target.value)} /></div>
        <div><label style={lbl}>Deposit ($)</label><input type="number" style={inp} value={f.deposit_paid} onChange={e => s('deposit_paid', e.target.value)} /></div>
        <div><label style={lbl}>Supplier Ref.</label><input style={inp} value={f.supplier_confirmation} onChange={e => s('supplier_confirmation', e.target.value)} /></div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>Notes / Special Requests</label>
        <input style={inp} value={f.notes} onChange={e => s('notes', e.target.value)} placeholder="Special requests, important info..." />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onSave({
          type, client_id: clientId, file_number: fileNumber,
          service_name: f.service_name || `${type} booking`,
          check_in: f.check_in || null, check_out: f.check_out || null,
          pickup_date: f.pickup_date || null, return_date: f.return_date || null,
          num_travelers: parseInt(f.num_travelers) || travelers.length,
          total_price: parseFloat(f.total_price) || 0,
          deposit_paid: parseFloat(f.deposit_paid) || 0,
          supplier_confirmation: f.supplier_confirmation || null,
          notes: f.notes || null, status: 'inquiry', details: f
        })} style={{ padding: '7px 18px', background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          Save Booking
        </button>
        <button onClick={onCancel} style={{ padding: '7px 14px', background: '#fff', border: '0.5px solid #d0d0d0', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
      </div>
    </div>
  )
}

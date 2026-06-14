import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, BedDouble, Car, Bus, Map, Ticket, UtensilsCrossed, Plane, FileText, Globe } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { t, Lang } from '../lib/i18n'

const BOOKING_TYPES = [
  { key: 'hotel',     label: 'Hotel',     icon: BedDouble,       color: '#185FA5', bg: '#E6F1FB' },
  { key: 'car_rental',label: 'Car Rental',icon: Car,             color: '#0F6E56', bg: '#E1F5EE' },
  { key: 'transfer',  label: 'Transfer',  icon: Bus,             color: '#854F0B', bg: '#FAEEDA' },
  { key: 'day_trip',  label: 'Day Trip',  icon: Map,             color: '#3B6D11', bg: '#EAF3DE' },
  { key: 'entrance',  label: 'Entrance',  icon: Ticket,          color: '#534AB7', bg: '#EEEDFE' },
  { key: 'meals',     label: 'Meals',     icon: UtensilsCrossed, color: '#993556', bg: '#FBEAF0' },
  { key: 'flight',    label: 'Flights',   icon: Plane,           color: '#0C447C', bg: '#B5D4F4' },
  { key: 'visa',      label: 'Visa',      icon: FileText,        color: '#993C1D', bg: '#FAECE7' },
]

const STATUS_STEPS = ['inquiry','quoted','confirmed','paid','voucher_sent','completed']

export default function ClientCard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<any>(null)
  const [travelers, setTravelers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [activeType, setActiveType] = useState('hotel')
  const [showNewBooking, setShowNewBooking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<Lang>('he')

  const L = (key: keyof typeof t) => t[key][lang]

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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>{L('loading')}</div>
  if (!client) return <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>{L('clientNotFound')}</div>

  const activeBookings = bookings.filter(b => b.type === activeType)
  const initials = client.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
  const allTravelers = [{ full_name: client.full_name, is_lead: true, type: 'adult', passport_number: client.passport_number, nationality: client.nationality, date_of_birth: client.date_of_birth }, ...travelers]

  return (
    <div style={{ padding: 24, direction: lang === 'he' ? 'rtl' : 'ltr' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => navigate('/clients')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <ArrowRight size={16} /> {L('clients')}
        </button>
        {/* Language toggle */}
        <button onClick={() => setLang(l => l === 'he' ? 'en' : 'he')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#f0f0f0', border: '0.5px solid #ddd', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
          <Globe size={13} /> {lang === 'he' ? 'English' : 'עברית'}
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
                <div style={{ color: '#7899bb', fontSize: 11, marginTop: 2 }}>{L('fileNumber')}: {client.file_number}</div>
              </div>
            </div>
            <div style={{ padding: 14 }}>
              {[
                [L('phone'), client.phone],
                [L('email'), client.email],
                [L('passport'), client.passport_number],
                [L('dob'), client.date_of_birth],
                [L('nationality'), client.nationality],
                [L('preferences'), client.preferences],
              ].filter(([,v]) => v).map(([label, val]) => (
                <div key={label} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: '#aaa', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#333', background: '#fafafa', borderRadius: 6, padding: '4px 8px', border: '0.5px solid #eee' }}>{val}</div>
                </div>
              ))}
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: client.status === 'lead' ? '#E1F5EE' : client.status === 'active' ? '#E6F1FB' : '#F1EFE8', color: client.status === 'lead' ? '#0F6E56' : client.status === 'active' ? '#185FA5' : '#5F5E5A', fontWeight: 500 }}>
                {L(client.status as keyof typeof t)}
              </span>
            </div>
          </div>

          {/* TRAVELERS */}
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{L('travelers')} ({allTravelers.length})</span>
              <button style={{ fontSize: 10, color: '#0F6E56', background: '#E1F5EE', border: '0.5px solid #5DCAA5', borderRadius: 20, padding: '2px 8px', cursor: 'pointer' }}>+ {lang === 'he' ? 'הוסף' : 'Add'}</button>
            </div>
            {allTravelers.map((tr, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: '#fafafa', borderRadius: 8, marginBottom: 5, border: '0.5px solid #eee' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: i === 0 ? '#1a2a3a' : '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: i === 0 ? '#fff' : '#185FA5', fontWeight: 600 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{tr.full_name}</div>
                  <div style={{ fontSize: 10, color: '#888' }}>
                    {tr.is_lead ? L('lead_traveler') : tr.type === 'child' ? `${L('child')} · ${lang === 'he' ? 'גיל' : 'Age'} ${tr.age}` : L('adult')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Booking type selector */}
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {lang === 'he' ? 'סוג הזמנה' : 'Booking Type'}
            </div>
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
              <span style={{ fontSize: 14, fontWeight: 600 }}>{BOOKING_TYPES.find(b => b.key === activeType)?.label} {lang === 'he' ? 'הזמנות' : 'Bookings'}</span>
              <button onClick={() => setShowNewBooking(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                <Plus size={13} /> {L('newBooking')}
              </button>
            </div>

            {showNewBooking && (
              <BookingForm
                type={activeType} clientId={id!} fileNumber={client.file_number}
                travelers={allTravelers} lang={lang}
                onSave={async (b) => {
                  const { data } = await supabase.from('bookings').insert(b).select().single()
                  if (data) { setBookings(bk => [data, ...bk]); setShowNewBooking(false) }
                }}
                onCancel={() => setShowNewBooking(false)}
              />
            )}

            {activeBookings.length === 0 && !showNewBooking ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#aaa', fontSize: 13 }}>
                {L('noBookings')}. {lang === 'he' ? 'לחץ "הזמנה חדשה"' : 'Click "New Booking"'}
              </div>
            ) : activeBookings.map(b => (
              <BookingRow key={b.id} booking={b} lang={lang}
                onStatusChange={async (newStatus) => {
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
                <span style={{ fontSize: 13, fontWeight: 600 }}>{L('allBookings')}</span>
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
                      {t[b.status as keyof typeof t]?.[lang] || b.status}
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

// ─── BOOKING ROW ────────────────────────────────────────────────────────────
function BookingRow({ booking: b, lang, onStatusChange }: { booking: any; lang: Lang; onStatusChange: (s: string) => void }) {
  const L = (key: keyof typeof t) => t[key][lang]
  const stepIdx = STATUS_STEPS.indexOf(b.status)

  return (
    <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{b.service_name}</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            {b.check_in || b.pickup_date || b.date} {b.check_out || b.return_date ? `→ ${b.check_out || b.return_date}` : ''} · {b.num_travelers} {L('travelers')}
          </div>
          {b.supplier_confirmation && <div style={{ fontSize: 10, color: '#0F6E56', marginTop: 2 }}>Ref: {b.supplier_confirmation}</div>}
        </div>
        <div style={{ textAlign: lang === 'he' ? 'left' : 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>${b.total_price}</div>
          <div style={{ fontSize: 10, color: '#3B6D11' }}>{L('deposit')}: ${b.deposit_paid}</div>
          <div style={{ fontSize: 10, color: '#854F0B' }}>{L('balance')}: ${(b.total_price - b.deposit_paid).toFixed(2)}</div>
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
              <div style={{ fontSize: 8, color: i <= stepIdx ? '#0F6E56' : '#aaa', marginTop: 2, textAlign: 'center', whiteSpace: 'nowrap' }}>
                {t[s as keyof typeof t]?.[lang] || s}
              </div>
            </div>
            {i < STATUS_STEPS.length - 1 && <div style={{ flex: 1, height: 1.5, background: i < stepIdx ? '#1D9E75' : '#eee', marginBottom: 14 }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {b.status === 'inquiry'     && <Abtn label={L('confirmQuote')}   color="#185FA5" bg="#E6F1FB" onClick={() => onStatusChange('quoted')} />}
        {b.status === 'quoted'      && <Abtn label={L('confirmBooking')} color="#0F6E56" bg="#E1F5EE" onClick={() => onStatusChange('confirmed')} />}
        {b.status === 'confirmed'   && <Abtn label={L('markPaid')}       color="#3B6D11" bg="#EAF3DE" onClick={() => onStatusChange('paid')} />}
        {b.status === 'paid'        && <Abtn label={L('sendVoucher')}    color="#534AB7" bg="#EEEDFE" onClick={() => onStatusChange('voucher_sent')} />}
        {b.status === 'voucher_sent'&& <Abtn label={L('complete')}       color="#0F6E56" bg="#E1F5EE" onClick={() => onStatusChange('completed')} />}
        {!['completed','cancelled'].includes(b.status) && <Abtn label={L('cancel')} color="#A32D2D" bg="#FCEBEB" onClick={() => onStatusChange('cancelled')} />}
        {b.notes && <span style={{ fontSize: 11, color: '#888', alignSelf: 'center' }}>📝 {b.notes}</span>}
      </div>
    </div>
  )
}

function Abtn({ label, color, bg, onClick }: { label: string; color: string; bg: string; onClick: () => void }) {
  return <button onClick={onClick} style={{ padding: '5px 12px', background: bg, color, border: `0.5px solid ${color}44`, borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>{label}</button>
}

// ─── BOOKING FORM — smart per type ──────────────────────────────────────────
function BookingForm({ type, clientId, fileNumber, travelers, lang, onSave, onCancel }: any) {
  const L = (key: keyof typeof t) => t[key][lang]
  const inp = { width: '100%', padding: '6px 8px', border: '0.5px solid #d0d0d0', borderRadius: 6, fontSize: 12, outline: 'none', direction: lang === 'he' ? 'rtl' : 'ltr', background: '#fafafa' } as React.CSSProperties
  const lbl = { fontSize: 10, color: '#555', fontWeight: '500', display: 'block', marginBottom: 3 } as React.CSSProperties
  const prefilled = { ...inp, background: '#E1F5EE', borderColor: '#5DCAA5', color: '#085041' }

  const [f, setF] = useState<any>({
    service_name: '', check_in: '', check_out: '', pickup_date: '', return_date: '',
    date: '', num_travelers: travelers.length, total_price: '', deposit_paid: '0',
    supplier_confirmation: '', notes: '',
    // type-specific
    room_type: '', meal_plan: 'BB', nights: '',
    car_type: '', rental_company: '', pickup_location: '', return_location: '', insurance: 'Full', days: '',
    from: '', to: '', flight_number: '', vehicle_type: 'Minibus',
    trip_name: '', meeting_point: '', meeting_time: '', guide: '',
    site_name: '', adults: '', children_count: '', price_adult: '', price_child: '',
    restaurant: '', meal_type: 'Dinner', dietary: '',
    airline: '', flight_no: '', origin: '', destination: '', departure_time: '', arrival_time: '', cabin_class: 'Economy', baggage: '', pnr: '',
    visa_type: '', visa_country: '', submission_date: '', collection_date: '', embassy: '',
  })
  const s = (k: string, v: any) => setF((prev: any) => ({ ...prev, [k]: v }))

  const leadTraveler = travelers.find((tr: any) => tr.is_lead)

  function buildDetails() {
    const base = { type_specific: {} as any }
    if (type === 'hotel') base.type_specific = { room_type: f.room_type, meal_plan: f.meal_plan, guests: travelers.map((tr: any) => ({ name: tr.full_name, type: tr.type, age: tr.age })) }
    if (type === 'car_rental') base.type_specific = { car_type: f.car_type, rental_company: f.rental_company, pickup_location: f.pickup_location, return_location: f.return_location, insurance: f.insurance }
    if (type === 'transfer') base.type_specific = { from: f.from, to: f.to, flight_number: f.flight_number, vehicle_type: f.vehicle_type }
    if (type === 'day_trip') base.type_specific = { trip_name: f.trip_name, meeting_point: f.meeting_point, meeting_time: f.meeting_time, guide: f.guide, travelers_list: travelers.map((tr: any) => tr.full_name) }
    if (type === 'entrance') base.type_specific = { site_name: f.site_name, adults: f.adults, children: f.children_count, price_adult: f.price_adult, price_child: f.price_child }
    if (type === 'meals') base.type_specific = { restaurant: f.restaurant, meal_type: f.meal_type, dietary: f.dietary, diners: travelers.map((tr: any) => tr.full_name) }
    if (type === 'flight') base.type_specific = { airline: f.airline, flight_no: f.flight_no, origin: f.origin, destination: f.destination, departure: f.departure_time, arrival: f.arrival_time, cabin_class: f.cabin_class, baggage: f.baggage, pnr: f.pnr, passengers: travelers.map((tr: any) => ({ name: tr.full_name, passport: tr.passport_number, dob: tr.date_of_birth, nationality: tr.nationality })) }
    if (type === 'visa') base.type_specific = { visa_type: f.visa_type, country: f.visa_country, embassy: f.embassy, applicants: travelers.map((tr: any) => ({ name: tr.full_name, passport: tr.passport_number, dob: tr.date_of_birth, nationality: tr.nationality })) }
    return base
  }

  const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 } as React.CSSProperties
  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 } as React.CSSProperties

  return (
    <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '0.5px solid #e5e5e5' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#1a2a3a', display: 'flex', alignItems: 'center', gap: 8 }}>
        {L('newBooking')} — {BOOKING_TYPES.find(b => b.key === type)?.label}
      </div>

      {/* HOTEL */}
      {type === 'hotel' && <>
        <div style={grid3}>
          <div><label style={lbl}>{L('hotelName')}</label><input style={inp} value={f.service_name} onChange={e => s('service_name', e.target.value)} placeholder="Hotel name" /></div>
          <div><label style={lbl}>{L('checkIn')}</label><input type="date" style={{ ...inp, direction: 'ltr' }} value={f.check_in} onChange={e => s('check_in', e.target.value)} /></div>
          <div><label style={lbl}>{L('checkOut')}</label><input type="date" style={{ ...inp, direction: 'ltr' }} value={f.check_out} onChange={e => s('check_out', e.target.value)} /></div>
        </div>
        <div style={grid3}>
          <div><label style={lbl}>{L('roomType')}</label>
            <select style={inp} value={f.room_type} onChange={e => s('room_type', e.target.value)}>
              <option value="">Select...</option>
              {['Standard','Deluxe Double','Twin','Suite','Family Room','Triple'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div><label style={lbl}>{L('mealPlan')}</label>
            <select style={inp} value={f.meal_plan} onChange={e => s('meal_plan', e.target.value)}>
              {['RO','BB','HB','FB','AI'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div><label style={lbl}>{L('nights')}</label><input type="number" style={inp} value={f.nights} onChange={e => s('nights', e.target.value)} /></div>
        </div>
        <div style={{ marginBottom: 8, background: '#E1F5EE', border: '0.5px solid #5DCAA5', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#0F6E56', fontWeight: 500, marginBottom: 4 }}>👥 {L('guestNames')} — {lang === 'he' ? 'מועבר אוטומטית' : 'Auto-transferred'}</div>
          {travelers.map((tr: any, i: number) => (
            <div key={i} style={{ fontSize: 11, color: '#085041', padding: '2px 0' }}>
              {i + 1}. {tr.full_name} {tr.type === 'child' ? `(${lang === 'he' ? 'ילד' : 'Child'}, ${lang === 'he' ? 'גיל' : 'Age'} ${tr.age})` : `(${lang === 'he' ? 'מבוגר' : 'Adult'})`}
              {tr.passport_number && ` · ${tr.passport_number}`}
            </div>
          ))}
        </div>
      </>}

      {/* CAR RENTAL */}
      {type === 'car_rental' && <>
        <div style={{ marginBottom: 8, background: '#E1F5EE', border: '0.5px solid #5DCAA5', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#0F6E56', fontWeight: 500, marginBottom: 4 }}>🔒 {lang === 'he' ? 'נהג מוביל — מועבר אוטומטית' : 'Lead Driver — Auto-transferred'}</div>
          <div style={{ fontSize: 11, color: '#085041' }}>{leadTraveler?.full_name} · {leadTraveler?.passport_number}</div>
        </div>
        <div style={grid3}>
          <div><label style={lbl}>{L('rentalCompany')}</label><input style={inp} value={f.service_name} onChange={e => s('service_name', e.target.value)} placeholder="Hertz, Avis..." /></div>
          <div><label style={lbl}>{L('carType')}</label>
            <select style={inp} value={f.car_type} onChange={e => s('car_type', e.target.value)}>
              {['Compact','Economy','SUV','Sedan','Minivan','Luxury','4x4'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label style={lbl}>{L('insurance')}</label>
            <select style={inp} value={f.insurance} onChange={e => s('insurance', e.target.value)}>
              {['Full','Basic','None'].map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
        </div>
        <div style={grid3}>
          <div><label style={lbl}>{L('pickupDate')}</label><input type="date" style={{ ...inp, direction: 'ltr' }} value={f.pickup_date} onChange={e => s('pickup_date', e.target.value)} /></div>
          <div><label style={lbl}>{L('returnDate')}</label><input type="date" style={{ ...inp, direction: 'ltr' }} value={f.return_date} onChange={e => s('return_date', e.target.value)} /></div>
          <div><label style={lbl}>{L('days')}</label><input type="number" style={inp} value={f.days} onChange={e => s('days', e.target.value)} /></div>
        </div>
        <div style={grid2}>
          <div><label style={lbl}>{L('pickupLocation')}</label><input style={inp} value={f.pickup_location} onChange={e => s('pickup_location', e.target.value)} placeholder="Airport, Hotel..." /></div>
          <div><label style={lbl}>{L('returnLocation')}</label><input style={inp} value={f.return_location} onChange={e => s('return_location', e.target.value)} /></div>
        </div>
      </>}

      {/* TRANSFER */}
      {type === 'transfer' && <>
        <div style={{ marginBottom: 8, background: '#E1F5EE', border: '0.5px solid #5DCAA5', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#0F6E56', fontWeight: 500, marginBottom: 2 }}>🔒 {lang === 'he' ? 'מועבר אוטומטית' : 'Auto-transferred'}</div>
          <div style={{ fontSize: 11, color: '#085041' }}>{leadTraveler?.full_name} · {travelers.length} {L('travelers')}</div>
        </div>
        <div style={grid3}>
          <div><label style={lbl}>{L('from')}</label><input style={inp} value={f.from} onChange={e => { s('from', e.target.value); s('service_name', `Transfer: ${e.target.value} → ${f.to}`) }} placeholder="Airport, Hotel..." /></div>
          <div><label style={lbl}>{L('to')}</label><input style={inp} value={f.to} onChange={e => { s('to', e.target.value); s('service_name', `Transfer: ${f.from} → ${e.target.value}`) }} placeholder="Hotel, City..." /></div>
          <div><label style={lbl}>{L('vehicleType')}</label>
            <select style={inp} value={f.vehicle_type} onChange={e => s('vehicle_type', e.target.value)}>
              {['Sedan','Minibus','Van','Bus','Luxury'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div style={grid3}>
          <div><label style={lbl}>{L('date')}</label><input type="date" style={{ ...inp, direction: 'ltr' }} value={f.pickup_date} onChange={e => s('pickup_date', e.target.value)} /></div>
          <div><label style={lbl}>{lang === 'he' ? 'שעה' : 'Time'}</label><input type="time" style={{ ...inp, direction: 'ltr' }} value={f.meeting_time} onChange={e => s('meeting_time', e.target.value)} /></div>
          <div><label style={lbl}>{L('flightNumber')}</label><input style={{ ...inp, direction: 'ltr' }} value={f.flight_number} onChange={e => s('flight_number', e.target.value)} placeholder="LY001" /></div>
        </div>
      </>}

      {/* DAY TRIP */}
      {type === 'day_trip' && <>
        <div style={{ marginBottom: 8, background: '#EAF3DE', border: '0.5px solid #97C459', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#3B6D11', fontWeight: 500, marginBottom: 4 }}>👥 {lang === 'he' ? 'כל הנוסעים — מועבר אוטומטית' : 'All Travelers — Auto-transferred'}</div>
          {travelers.map((tr: any, i: number) => <div key={i} style={{ fontSize: 11, color: '#2a5a08' }}>{i+1}. {tr.full_name}{tr.type === 'child' ? ` (${lang === 'he' ? 'גיל' : 'Age'} ${tr.age})` : ''}</div>)}
        </div>
        <div style={grid3}>
          <div><label style={lbl}>{L('tripName')}</label><input style={inp} value={f.service_name} onChange={e => s('service_name', e.target.value)} placeholder="Dead Sea, Petra..." /></div>
          <div><label style={lbl}>{L('date')}</label><input type="date" style={{ ...inp, direction: 'ltr' }} value={f.pickup_date} onChange={e => s('pickup_date', e.target.value)} /></div>
          <div><label style={lbl}>{L('guide')}</label><input style={inp} value={f.guide} onChange={e => s('guide', e.target.value)} /></div>
        </div>
        <div style={grid2}>
          <div><label style={lbl}>{L('meetingPoint')}</label><input style={inp} value={f.meeting_point} onChange={e => s('meeting_point', e.target.value)} /></div>
          <div><label style={lbl}>{L('meetingTime')}</label><input type="time" style={{ ...inp, direction: 'ltr' }} value={f.meeting_time} onChange={e => s('meeting_time', e.target.value)} /></div>
        </div>
      </>}

      {/* ENTRANCE */}
      {type === 'entrance' && <>
        <div style={{ marginBottom: 8, background: '#EEEDFE', border: '0.5px solid #AFA9EC', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#534AB7', fontWeight: 500, marginBottom: 2 }}>🔒 {lang === 'he' ? 'מועבר אוטומטית' : 'Auto-transferred'}</div>
          <div style={{ fontSize: 11, color: '#3C3489' }}>{travelers.filter((tr:any) => tr.type !== 'child').length} {L('adults')} · {travelers.filter((tr:any) => tr.type === 'child').length} {L('children')} {travelers.filter((tr:any) => tr.type === 'child').length > 0 ? `(${lang === 'he' ? 'גיל' : 'Ages'}: ${travelers.filter((tr:any) => tr.type === 'child').map((tr:any) => tr.age).join(', ')})` : ''}</div>
        </div>
        <div style={grid3}>
          <div><label style={lbl}>{L('siteName')}</label><input style={inp} value={f.service_name} onChange={e => s('service_name', e.target.value)} placeholder="Masada, Petra..." /></div>
          <div><label style={lbl}>{L('date')}</label><input type="date" style={{ ...inp, direction: 'ltr' }} value={f.pickup_date} onChange={e => s('pickup_date', e.target.value)} /></div>
          <div><label style={lbl}>{L('nationality')}</label><input style={prefilled} value={leadTraveler?.nationality || ''} readOnly /></div>
        </div>
        <div style={grid3}>
          <div><label style={lbl}>{L('adults')}</label><input type="number" style={prefilled} value={travelers.filter((tr:any) => tr.type !== 'child').length} readOnly /></div>
          <div><label style={lbl}>{L('children')}</label><input type="number" style={prefilled} value={travelers.filter((tr:any) => tr.type === 'child').length} readOnly /></div>
          <div><label style={lbl}>{L('childAges')}</label><input style={prefilled} value={travelers.filter((tr:any)=>tr.type==='child').map((tr:any)=>tr.age).join(', ')||'-'} readOnly /></div>
        </div>
        <div style={grid2}>
          <div><label style={lbl}>{L('priceAdult')} ($)</label><input type="number" style={inp} value={f.price_adult} onChange={e => s('price_adult', e.target.value)} /></div>
          <div><label style={lbl}>{L('priceChild')} ($)</label><input type="number" style={inp} value={f.price_child} onChange={e => s('price_child', e.target.value)} /></div>
        </div>
      </>}

      {/* MEALS */}
      {type === 'meals' && <>
        <div style={{ marginBottom: 8, background: '#FBEAF0', border: '0.5px solid #DDA0BD', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#993556', fontWeight: 500, marginBottom: 4 }}>👥 {lang === 'he' ? 'סועדים — מועבר אוטומטית' : 'Diners — Auto-transferred'}</div>
          {travelers.map((tr: any, i: number) => <div key={i} style={{ fontSize: 11, color: '#6B2340' }}>{i+1}. {tr.full_name}{tr.type === 'child' ? ` (${lang === 'he' ? 'ילד' : 'Child'})` : ''}</div>)}
        </div>
        <div style={grid3}>
          <div><label style={lbl}>{L('restaurantName')}</label><input style={inp} value={f.service_name} onChange={e => s('service_name', e.target.value)} /></div>
          <div><label style={lbl}>{L('date')}</label><input type="date" style={{ ...inp, direction: 'ltr' }} value={f.pickup_date} onChange={e => s('pickup_date', e.target.value)} /></div>
          <div><label style={lbl}>{L('mealType')}</label>
            <select style={inp} value={f.meal_type} onChange={e => s('meal_type', e.target.value)}>
              {['Breakfast','Lunch','Dinner','Brunch'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div><label style={lbl}>{L('dietaryReq')}</label><input style={inp} value={f.dietary} onChange={e => s('dietary', e.target.value)} placeholder="Vegetarian, Halal, Kosher..." /></div>
      </>}

      {/* FLIGHT */}
      {type === 'flight' && <>
        <div style={{ marginBottom: 8, background: '#B5D4F4', border: '0.5px solid #6AAAE0', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#0C447C', fontWeight: 500, marginBottom: 4 }}>🔒 {lang === 'he' ? 'כל הנוסעים — מועבר אוטומטית עם פרטי דרכון' : 'All Passengers — Auto-transferred with passport details'}</div>
          {travelers.map((tr: any, i: number) => (
            <div key={i} style={{ fontSize: 11, color: '#0C447C', display: 'flex', gap: 8 }}>
              <span>{i+1}. {tr.full_name}</span>
              {tr.passport_number && <span>· {tr.passport_number}</span>}
              {tr.date_of_birth && <span>· {tr.date_of_birth}</span>}
              {tr.nationality && <span>· {tr.nationality}</span>}
            </div>
          ))}
        </div>
        <div style={grid3}>
          <div><label style={lbl}>{L('airline')}</label><input style={inp} value={f.airline} onChange={e => { s('airline', e.target.value); s('service_name', `${e.target.value} ${f.flight_no}`) }} placeholder="El Al, Ryanair..." /></div>
          <div><label style={lbl}>{L('flightNo')}</label><input style={{ ...inp, direction: 'ltr' }} value={f.flight_no} onChange={e => { s('flight_no', e.target.value); s('service_name', `${f.airline} ${e.target.value}`) }} placeholder="LY001" /></div>
          <div><label style={lbl}>{L('pnr')}</label><input style={{ ...inp, direction: 'ltr' }} value={f.pnr} onChange={e => { s('pnr', e.target.value); s('supplier_confirmation', e.target.value) }} /></div>
        </div>
        <div style={grid3}>
          <div><label style={lbl}>{L('origin')}</label><input style={{ ...inp, direction: 'ltr' }} value={f.origin} onChange={e => s('origin', e.target.value)} placeholder="TLV" /></div>
          <div><label style={lbl}>{L('destination')}</label><input style={{ ...inp, direction: 'ltr' }} value={f.destination} onChange={e => s('destination', e.target.value)} placeholder="JFK" /></div>
          <div><label style={lbl}>{L('class')}</label>
            <select style={inp} value={f.cabin_class} onChange={e => s('cabin_class', e.target.value)}>
              {['Economy','Premium Economy','Business','First'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={grid3}>
          <div><label style={lbl}>{L('departure')}</label><input type="datetime-local" style={{ ...inp, direction: 'ltr' }} value={f.departure_time} onChange={e => { s('departure_time', e.target.value); s('pickup_date', e.target.value.split('T')[0]) }} /></div>
          <div><label style={lbl}>{L('arrival')}</label><input type="datetime-local" style={{ ...inp, direction: 'ltr' }} value={f.arrival_time} onChange={e => s('arrival_time', e.target.value)} /></div>
          <div><label style={lbl}>{L('baggage')}</label><input style={inp} value={f.baggage} onChange={e => s('baggage', e.target.value)} placeholder="20kg, 1 piece..." /></div>
        </div>
      </>}

      {/* VISA */}
      {type === 'visa' && <>
        <div style={{ marginBottom: 8, background: '#FAECE7', border: '0.5px solid #E0A898', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#993C1D', fontWeight: 500, marginBottom: 4 }}>🔒 {lang === 'he' ? 'כל הפרטים — מועבר אוטומטית' : 'Full details — Auto-transferred'}</div>
          {travelers.map((tr: any, i: number) => (
            <div key={i} style={{ fontSize: 11, color: '#6B2810', display: 'flex', gap: 8, marginBottom: 2 }}>
              <span>{i+1}. {tr.full_name}</span>
              {tr.passport_number && <span>· {tr.passport_number}</span>}
              {tr.date_of_birth && <span>· {tr.date_of_birth}</span>}
              {tr.nationality && <span>· {tr.nationality}</span>}
            </div>
          ))}
        </div>
        <div style={grid3}>
          <div><label style={lbl}>{L('visaFor')}</label><input style={inp} value={f.service_name} onChange={e => s('service_name', `Visa: ${e.target.value}`)} placeholder="USA, Schengen..." /></div>
          <div><label style={lbl}>{L('visaType')}</label>
            <select style={inp} value={f.visa_type} onChange={e => s('visa_type', e.target.value)}>
              {['Tourist','Business','Transit','Student','Work'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div><label style={lbl}>{L('embassy')}</label><input style={inp} value={f.embassy} onChange={e => s('embassy', e.target.value)} /></div>
        </div>
        <div style={grid2}>
          <div><label style={lbl}>{L('submissionDate')}</label><input type="date" style={{ ...inp, direction: 'ltr' }} value={f.submission_date} onChange={e => { s('submission_date', e.target.value); s('pickup_date', e.target.value) }} /></div>
          <div><label style={lbl}>{L('collectionDate')}</label><input type="date" style={{ ...inp, direction: 'ltr' }} value={f.collection_date} onChange={e => { s('collection_date', e.target.value); s('return_date', e.target.value) }} /></div>
        </div>
      </>}

      {/* COMMON BOTTOM FIELDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8, marginBottom: 8 }}>
        <div><label style={lbl}>{L('totalPrice')} ($)</label><input type="number" style={inp} value={f.total_price} onChange={e => s('total_price', e.target.value)} /></div>
        <div><label style={lbl}>{L('deposit')} ($)</label><input type="number" style={inp} value={f.deposit_paid} onChange={e => s('deposit_paid', e.target.value)} /></div>
        <div><label style={lbl}>{L('supplierRef')}</label><input style={{ ...inp, direction: 'ltr' }} value={f.supplier_confirmation} onChange={e => s('supplier_confirmation', e.target.value)} /></div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>{L('notes')}</label>
        <input style={inp} value={f.notes} onChange={e => s('notes', e.target.value)} placeholder={lang === 'he' ? 'הערות מיוחדות...' : 'Special requests...'} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onSave({
          type, client_id: clientId, file_number: fileNumber,
          service_name: f.service_name || `${type} booking`,
          check_in: f.check_in || null, check_out: f.check_out || null,
          pickup_date: f.pickup_date || null, return_date: f.return_date || null,
          date: f.date || null,
          num_travelers: parseInt(f.num_travelers) || travelers.length,
          total_price: parseFloat(f.total_price) || 0,
          deposit_paid: parseFloat(f.deposit_paid) || 0,
          supplier_confirmation: f.supplier_confirmation || null,
          notes: f.notes || null,
          status: 'inquiry',
          details: buildDetails()
        })} style={{ padding: '7px 18px', background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          {L('saveBooking')}
        </button>
        <button onClick={onCancel} style={{ padding: '7px 14px', background: '#fff', border: '0.5px solid #d0d0d0', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
          {lang === 'he' ? 'ביטול' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, BedDouble, Car, Bus, Map, Ticket, UtensilsCrossed, Plane, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'

const BOOKING_TYPES = [
  { key: 'hotel', label: 'Hotel', icon: BedDouble, color: '#185FA5', bg: '#E6F1FB' },
  { key: 'car_rental', label: 'Car Rental', icon: Car, color: '#0F6E56', bg: '#E1F5EE' },
  { key: 'transfer', label: 'Transfer', icon: Bus, color: '#854F0B', bg: '#FAEEDA' },
  { key: 'day_trip', label: 'Day Trip', icon: Map, color: '#3B6D11', bg: '#EAF3DE' },
  { key: 'entrance', label: 'Entrance', icon: Ticket, color: '#534AB7', bg: '#EEEDFE' },
  { key: 'meals', label: 'Meals', icon: UtensilsCrossed, color: '#993556', bg: '#FBEAF0' },
  { key: 'flight', label: 'Flights', icon: Plane, color: '#0C447C', bg: '#B5D4F4' },
  { key: 'visa', label: 'Visa', icon: FileText, color: '#993C1D', bg: '#FAECE7' },
]

const STATUS_STEPS = ['inquiry', 'quoted', 'confirmed', 'paid', 'voucher_sent', 'completed']
const STATUS_LABELS: Record<string, string> = { inquiry: 'בירור', quoted: 'הוצע', confirmed: 'מאושר', paid: 'שולם', voucher_sent: 'ווצ׳ר נשלח', completed: 'הושלם', cancelled: 'בוטל' }

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
      const [{ data: c }, { data: t }, { data: b }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id).single(),
        supabase.from('travelers').select('*').eq('client_id', id),
        supabase.from('bookings').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      ])
      setClient(c)
      setTravelers(t || [])
      setBookings(b || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>טוען...</div>
  if (!client) return <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>לקוח לא נמצא</div>

  const activeBookings = bookings.filter(b => b.type === activeType)
  const initials = client.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)

  return (
    <div style={{ padding: 24, direction: 'rtl' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={() => navigate('/clients')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}><ArrowRight size={16} /> לקוחות</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
            <div style={{ background: '#1a2a3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#185FA5', flexShrink: 0 }}>{initials}</div>
              <div>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{client.full_name}</div>
                <div style={{ color: '#7899bb', fontSize: 11, marginTop: 2 }}>תיק {client.file_number}</div>
              </div>
            </div>
            <div style={{ padding: 14 }}>
              {[['טלפון', client.phone], ['אימייל', client.email], ['דרכון', client.passport_number], ['ת. לידה', client.date_of_birth], ['לאום', client.nationality], ['העדפות', client.preferences]].filter(([, v]) => v).map(([label, val]) => (
                <div key={label} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: '#aaa', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#333', background: '#fafafa', borderRadius: 6, padding: '4px 8px', border: '0.5px solid #eee' }}>{val}</div>
                </div>
              ))}
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: client.status === 'lead' ? '#E1F5EE' : client.status === 'active' ? '#E6F1FB' : '#F1EFE8', color: client.status === 'lead' ? '#0F6E56' : client.status === 'active' ? '#185FA5' : '#5F5E5A', fontWeight: 500 }}>
                  {client.status === 'lead' ? 'ליד' : client.status === 'active' ? 'פעיל' : 'עבר'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>נוסעים ({travelers.length + 1})</span>
              <button style={{ fontSize: 10, color: '#0F6E56', background: '#E1F5EE', border: '0.5px solid #5DCAA5', borderRadius: 20, padding: '2px 8px', cursor: 'pointer' }}>+ הוסף</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: '#fafafa', borderRadius: 8, marginBottom: 5, border: '0.5px solid #eee' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#1a2a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 600 }}>1</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{client.full_name}</div>
                <div style={{ fontSize: 10, color: '#888' }}>מוביל</div>
              </div>
            </div>
            {travelers.map((t, i) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: '#fafafa', borderRadius: 8, marginBottom: 5, border: '0.5px solid #eee' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#185FA5', fontWeight: 600 }}>{i + 2}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12 }}>{t.full_name}</div>
                  <div style={{ fontSize: 10, color: '#888' }}>{t.type === 'child' ? `ילד · גיל ${t.age}` : 'מבוגר'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8 }}>סוג הזמנה</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
              {BOOKING_TYPES.map(({ key, label, icon: Icon, color, bg }) => (
                <button key={key} onClick={() => { setActiveType(key); setShowNewBooking(false) }} style={{ border: activeType === key ? `2px solid ${color}` : '0.5px solid #e5e5e5', borderRadius: 10, padding: '8px 4px', textAlign: 'center', cursor: 'pointer', background: activeType === key ? bg : '#fff', transition: 'all 0.15s' }}>
                  <Icon size={18} color={activeType === key ? color : '#aaa'} style={{ display: 'block', margin: '0 auto 4px' }} />
                  <span style={{ fontSize: 9, color: activeType === key ? color : '#888', fontWeight: activeType === key ? 600 : 400 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{BOOKING_TYPES.find(t => t.key === activeType)?.label} Bookings</span>
              <button onClick={() => setShowNewBooking(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                <Plus size={13} /> הזמנה חדשה
              </button>
            </div>

            {showNewBooking && <NewBookingForm type={activeType} clientId={id!} fileNumber={client.file_number} travelers={[{ full_name: client.full_name, is_lead: true, type: 'adult' }, ...travelers]} onSave={async (b) => { const { data } = await supabase.from('bookings').insert(b).select().single(); if (data) { setBookings(bk => [data, ...bk]); setShowNewBooking(false) } }} onCancel={() => setShowNewBooking(false)} />}

            {activeBookings.length === 0 && !showNewBooking ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#aaa', fontSize: 13 }}>אין הזמנות מסוג זה. לחץ "הזמנה חדשה"</div>
            ) : activeBookings.map(b => (
              <BookingRow key={b.id} booking={b} onStatusChange={async (newStatus) => {
                await supabase.from('bookings').update({ status: newStatus }).eq('id', b.id)
                setBookings(bks => bks.map(bk => bk.id === b.id ? { ...bk, status: newStatus } : bk))
              }} />
            ))}
          </div>

          {bookings.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0' }}><span style={{ fontSize: 13, fontWeight: 600 }}>כל ההזמנות בתיק</span></div>
              {bookings.map(b => {
                const bt = BOOKING_TYPES.find(t => t.key === b.type)
                return (
                  <div key={b.id} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '0.5px solid #f8f8f8' }}>
                    {bt && <div style={{ background: bt.bg, borderRadius: 8, padding: 6 }}><bt.icon size={14} color={bt.color} /></div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{b.service_name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{b.check_in || b.pickup_date} · ${b.total_price}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f0f0f0', color: '#555', fontWeight: 500 }}>{STATUS_LABELS[b.status]}</span>
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
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{b.check_in || b.pickup_date} → {b.check_out || b.return_date} · {b.num_travelers} נוסעים</div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>${b.total_price}</div>
          <div style={{ fontSize: 10, color: '#3B6D11' }}>מקדמה: ${b.deposit_paid}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 10 }}>
        {STATUS_STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, border: `1.5px solid ${i <= stepIdx ? '#1D9E75' : '#ddd'}`, background: i < stepIdx ? '#1D9E75' : i === stepIdx ? '#E1F5EE' : '#fff', color: i < stepIdx ? '#fff' : i === stepIdx ? '#0F6E56' : '#aaa' }}>{i < stepIdx ? '✓' : i + 1}</div>
              <div style={{ fontSize: 8, color: i <= stepIdx ? '#0F6E56' : '#aaa', marginTop: 2, textAlign: 'center', whiteSpace: 'nowrap' }}>{STATUS_LABELS[s]}</div>
            </div>
            {i < STATUS_STEPS.length - 1 && <div style={{ flex: 1, height: 1.5, background: i < stepIdx ? '#1D9E75' : '#eee', marginBottom: 14 }} />}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {b.status === 'inquiry' && <ActionBtn label="אשר הצעה" color="#185FA5" bg="#E6F1FB" onClick={() => onStatusChange('quoted')} />}
        {b.status === 'quoted' && <ActionBtn label="אשר הזמנה" color="#0F6E56" bg="#E1F5EE" onClick={() => onStatusChange('confirmed')} />}
        {b.status === 'confirmed' && <ActionBtn label="סמן כשולם" color="#3B6D11" bg="#EAF3DE" onClick={() => onStatusChange('paid')} />}
        {b.status === 'paid' && <ActionBtn label="שלח ווצ׳ר" color="#534AB7" bg="#EEEDFE" onClick={() => onStatusChange('voucher_sent')} />}
        {b.status === 'voucher_sent' && <ActionBtn label="סיים הזמנה" color="#0F6E56" bg="#E1F5EE" onClick={() => onStatusChange('completed')} />}
        {b.status !== 'completed' && b.status !== 'cancelled' && <ActionBtn label="בטל" color="#A32D2D" bg="#FCEBEB" onClick={() => onStatusChange('cancelled')} />}
        {b.notes && <span style={{ fontSize: 11, color: '#888', alignSelf: 'center', marginRight: 4 }}>📝 {b.notes}</span>}
      </div>
    </div>
  )
}

function ActionBtn({ label, color, bg, onClick }: { label: string; color: string; bg: string; onClick: () => void }) {
  return <button onClick={onClick} style={{ padding: '5px 12px', background: bg, color, border: `0.5px solid ${color}44`, borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>{label}</button>
}

function NewBookingForm({ type, clientId, fileNumber, travelers, onSave, onCancel }: any) {
  const [form, setForm] = useState({ service_name: '', check_in: '', check_out: '', pickup_date: '', return_date: '', num_travelers: travelers.length, total_price: '', deposit_paid: '0', supplier_confirmation: '', notes: '' })
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const isDateBased = ['hotel'].includes(type)

  return (
    <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '0.5px solid #e5e5e5' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#1a2a3a' }}>הזמנה חדשה — {type}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div><label style={{ fontSize: 10, color: '#555', fontWeight: 500, display: 'block', marginBottom: 3 }}>שם השירות</label><input style={{ width: '100%', padding: '6px 8px', border: '0.5px solid #d0d0d0', borderRadius: 6, fontSize: 12, outline: 'none', direction: 'rtl' }} value={form.service_name} onChange={e => set('service_name', e.target.value)} placeholder={type === 'hotel' ? 'שם המלון' : type === 'car_rental' ? 'חברת השכרה' : 'שם השירות'} /></div>
        <div><label style={{ fontSize: 10, color: '#555', fontWeight: 500, display: 'block', marginBottom: 3 }}>{isDateBased ? 'צ׳ק-אין' : 'תאריך'}</label><input type="date" style={{ width: '100%', padding: '6px 8px', border: '0.5px solid #d0d0d0', borderRadius: 6, fontSize: 12, outline: 'none', direction: 'ltr' }} value={isDateBased ? form.check_in : form.pickup_date} onChange={e => set(isDateBased ? 'check_in' : 'pickup_date', e.target.value)} /></div>
        <div><label style={{ fontSize: 10, color: '#555', fontWeight: 500, display: 'block', marginBottom: 3 }}>{isDateBased ? 'צ׳ק-אאוט' : 'תאריך סיום'}</label><input type="date" style={{ width: '100%', padding: '6px 8px', border: '0.5px solid #d0d0d0', borderRadius: 6, fontSize: 12, outline: 'none', direction: 'ltr' }} value={isDateBased ? form.check_out : form.return_date} onChange={e => set(isDateBased ? 'check_out' : 'return_date', e.target.value)} /></div>
        <div><label style={{ fontSize: 10, color: '#555', fontWeight: 500, display: 'block', marginBottom: 3 }}>מחיר כולל ($)</label><input type="number" style={{ width: '100%', padding: '6px 8px', border: '0.5px solid #d0d0d0', borderRadius: 6, fontSize: 12, outline: 'none' }} value={form.total_price} onChange={e => set('total_price', e.target.value)} /></div>
        <div><label style={{ fontSize: 10, color: '#555', fontWeight: 500, display: 'block', marginBottom: 3 }}>מקדמה ($)</label><input type="number" style={{ width: '100%', padding: '6px 8px', border: '0.5px solid #d0d0d0', borderRadius: 6, fontSize: 12, outline: 'none' }} value={form.deposit_paid} onChange={e => set('deposit_paid', e.target.value)} /></div>
        <div><label style={{ fontSize: 10, color: '#555', fontWeight: 500, display: 'block', marginBottom: 3 }}>מספר אישור ספק</label><input style={{ width: '100%', padding: '6px 8px', border: '0.5px solid #d0d0d0', borderRadius: 6, fontSize: 12, outline: 'none', direction: 'ltr' }} value={form.supplier_confirmation} onChange={e => set('supplier_confirmation', e.target.value)} /></div>
      </div>
      <div style={{ marginBottom: 10 }}><label style={{ fontSize: 10, color: '#555', fontWeight: 500, display: 'block', marginBottom: 3 }}>הערות</label><input style={{ width: '100%', padding: '6px 8px', border: '0.5px solid #d0d0d0', borderRadius: 6, fontSize: 12, outline: 'none', direction: 'rtl' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="הערות מיוחדות..." /></div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onSave({ ...form, type, client_id: clientId, file_number: fileNumber, num_travelers: form.num_travelers, total_price: parseFloat(form.total_price) || 0, deposit_paid: parseFloat(form.deposit_paid) || 0, status: 'inquiry', details: {} })} style={{ padding: '7px 16px', background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>שמור הזמנה</button>
        <button onClick={onCancel} style={{ padding: '7px 14px', background: '#fff', border: '0.5px solid #d0d0d0', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>ביטול</button>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const inputStyle = { width: '100%', padding: '8px 10px', border: '0.5px solid #d0d0d0', borderRadius: 8, fontSize: 13, outline: 'none', direction: 'rtl' as const, background: '#fafafa' }
const labelStyle = { fontSize: 11, color: '#555', fontWeight: 500, marginBottom: 4, display: 'block' as const }

export default function NewClient() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', passport_number: '', date_of_birth: '', nationality: '', status: 'lead', preferences: '' })
  const [travelers, setTravelers] = useState<any[]>([])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const addTraveler = () => setTravelers(t => [...t, { full_name: '', type: 'adult', age: '', passport_number: '', date_of_birth: '', nationality: '', gender: '' }])
  const setTraveler = (i: number, k: string, v: string) => setTravelers(t => t.map((tr, idx) => idx === i ? { ...tr, [k]: v } : tr))
  const removeTraveler = (i: number) => setTravelers(t => t.filter((_, idx) => idx !== i))

  async function save() {
    if (!form.full_name) return alert('נא להזין שם מלא')
    setSaving(true)
    const fileNum = 'TRV-' + String(Date.now()).slice(-4).padStart(4, '0')
    const { data: client, error } = await supabase.from('clients').insert({ ...form, file_number: fileNum }).select().single()
    if (error) { alert('שגיאה: ' + error.message); setSaving(false); return }
    if (travelers.length > 0) {
      await supabase.from('travelers').insert(travelers.map((t, i) => ({ ...t, client_id: client.id, is_lead: i === 0, age: t.age ? parseInt(t.age) : null })))
    }
    navigate(`/clients/${client.id}`)
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => navigate('/clients')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}><ArrowRight size={16} /> חזרה ללקוחות</button>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>פתיחת תיק לקוח חדש</h1>

      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#1a2a3a' }}>פרטי לקוח מוביל</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>שם מלא *</label><input style={inputStyle} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="שם פרטי ומשפחה" /></div>
          <div><label style={labelStyle}>טלפון</label><input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+972-50-..." /></div>
          <div><label style={labelStyle}>אימייל</label><input style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" /></div>
          <div><label style={labelStyle}>לאום</label><input style={inputStyle} value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="Israeli" /></div>
          <div><label style={labelStyle}>מספר דרכון</label><input style={inputStyle} value={form.passport_number} onChange={e => set('passport_number', e.target.value)} /></div>
          <div><label style={labelStyle}>תאריך לידה</label><input style={{ ...inputStyle, direction: 'ltr' }} type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></div>
        </div>
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>סטטוס</label>
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="lead">ליד</option>
              <option value="active">לקוח פעיל</option>
              <option value="past">לקוח עבר</option>
            </select>
          </div>
          <div><label style={labelStyle}>העדפות מיוחדות</label><input style={inputStyle} value={form.preferences} onChange={e => set('preferences', e.target.value)} placeholder="קומה גבוהה, ללא עישון..." /></div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1a2a3a' }}>נוסעים נוספים</h2>
          <button onClick={addTraveler} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#E1F5EE', color: '#0F6E56', border: '0.5px solid #5DCAA5', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
            <Plus size={13} /> הוסף נוסע
          </button>
        </div>
        {travelers.length === 0 ? (
          <div style={{ color: '#aaa', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>לא נוספו נוסעים. לחץ "הוסף נוסע" להוספת בן/בת זוג, ילדים וכו'</div>
        ) : travelers.map((t, i) => (
          <div key={i} style={{ background: '#fafafa', borderRadius: 8, border: '0.5px solid #e8e8e8', padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>נוסע {i + 1}</span>
              <button onClick={() => removeTraveler(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}><Trash2 size={13} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <div><label style={labelStyle}>שם מלא</label><input style={inputStyle} value={t.full_name} onChange={e => setTraveler(i, 'full_name', e.target.value)} /></div>
              <div><label style={labelStyle}>סוג</label>
                <select style={inputStyle} value={t.type} onChange={e => setTraveler(i, 'type', e.target.value)}>
                  <option value="adult">מבוגר</option>
                  <option value="child">ילד</option>
                </select>
              </div>
              {t.type === 'child' && <div><label style={labelStyle}>גיל</label><input style={inputStyle} type="number" value={t.age} onChange={e => setTraveler(i, 'age', e.target.value)} placeholder="גיל" /></div>}
              <div><label style={labelStyle}>דרכון</label><input style={inputStyle} value={t.passport_number} onChange={e => setTraveler(i, 'passport_number', e.target.value)} /></div>
              <div><label style={labelStyle}>לאום</label><input style={inputStyle} value={t.nationality} onChange={e => setTraveler(i, 'nationality', e.target.value)} /></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => navigate('/clients')} style={{ padding: '9px 20px', border: '0.5px solid #d0d0d0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>ביטול</button>
        <button onClick={save} disabled={saving} style={{ padding: '9px 20px', background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          {saving ? 'שומר...' : 'פתח תיק לקוח'}
        </button>
      </div>
    </div>
  )
}

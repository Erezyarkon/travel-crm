import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const inp = { width: '100%', padding: '8px 10px', border: '0.5px solid #d0d0d0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fafafa' } as React.CSSProperties
const lbl = { fontSize: 11, color: '#555', fontWeight: '500' as const, marginBottom: 4, display: 'block' as const }

export default function NewClient() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', passport_number: '', date_of_birth: '', nationality: '', status: 'lead', preferences: '' })
  const [travelers, setTravelers] = useState<any[]>([])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const addTraveler = () => setTravelers(t => [...t, { full_name: '', type: 'adult', age: '', passport_number: '', date_of_birth: '', nationality: '', gender: '' }])
  const setTraveler = (i: number, k: string, v: string) => setTravelers(t => t.map((tr, idx) => idx === i ? { ...tr, [k]: v } : tr))
  const removeTraveler = (i: number) => setTravelers(t => t.filter((_, idx) => idx !== i))

  async function save() {
    if (!form.full_name) return alert('Please enter full name')
    setSaving(true)
    const fileNum = 'TRV-' + String(Date.now()).slice(-4).padStart(4, '0')
    const { data: client, error } = await supabase.from('clients').insert({ ...form, file_number: fileNum, owner_id: user?.id || null }).select().single()
    if (error) { alert('Error: ' + error.message); setSaving(false); return }
    if (travelers.length > 0) {
      await supabase.from('travelers').insert(travelers.map((t, i) => ({ ...t, client_id: client.id, is_lead: i === 0, age: t.age ? parseInt(t.age) : null })))
    }
    navigate(`/clients/${client.id}`)
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => navigate('/clients')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}><ArrowLeft size={16} /> Back to Clients</button>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Open New Client File</h1>

      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#1a2a3a' }}>Lead Traveler Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={lbl}>Full Name *</label><input style={inp} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="First and last name" /></div>
          <div><label style={lbl}>Phone</label><input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+972-50-..." /></div>
          <div><label style={lbl}>Email</label><input style={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" /></div>
          <div><label style={lbl}>Nationality</label><input style={inp} value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="Israeli" /></div>
          <div><label style={lbl}>Passport Number</label><input style={inp} value={form.passport_number} onChange={e => set('passport_number', e.target.value)} /></div>
          <div><label style={lbl}>Date of Birth</label><input style={inp} type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></div>
        </div>
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={lbl}>Status</label>
            <select style={inp} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="lead">Lead</option>
              <option value="active">Active Client</option>
              <option value="past">Past Client</option>
            </select>
          </div>
          <div><label style={lbl}>Special Preferences</label><input style={inp} value={form.preferences} onChange={e => set('preferences', e.target.value)} placeholder="High floor, non-smoking..." /></div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1a2a3a' }}>Additional Travelers</h2>
          <button onClick={addTraveler} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#E1F5EE', color: '#0F6E56', border: '0.5px solid #5DCAA5', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
            <Plus size={13} /> Add Traveler
          </button>
        </div>
        {travelers.length === 0 ? (
          <div style={{ color: '#aaa', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>No additional travelers. Click "Add Traveler" to add spouse, children, etc.</div>
        ) : travelers.map((tr, i) => (
          <div key={i} style={{ background: '#fafafa', borderRadius: 8, border: '0.5px solid #e8e8e8', padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Traveler {i + 1}</span>
              <button onClick={() => removeTraveler(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}><Trash2 size={13} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <div><label style={lbl}>Full Name</label><input style={inp} value={tr.full_name} onChange={e => setTraveler(i, 'full_name', e.target.value)} /></div>
              <div><label style={lbl}>Type</label>
                <select style={inp} value={tr.type} onChange={e => setTraveler(i, 'type', e.target.value)}>
                  <option value="adult">Adult</option>
                  <option value="child">Child</option>
                </select>
              </div>
              {tr.type === 'child' && <div><label style={lbl}>Age</label><input style={inp} type="number" value={tr.age} onChange={e => setTraveler(i, 'age', e.target.value)} placeholder="Age" /></div>}
              <div><label style={lbl}>Passport No.</label><input style={inp} value={tr.passport_number} onChange={e => setTraveler(i, 'passport_number', e.target.value)} /></div>
              <div><label style={lbl}>Nationality</label><input style={inp} value={tr.nationality} onChange={e => setTraveler(i, 'nationality', e.target.value)} /></div>
              <div><label style={lbl}>Date of Birth</label><input style={inp} type="date" value={tr.date_of_birth} onChange={e => setTraveler(i, 'date_of_birth', e.target.value)} /></div>
              <div><label style={lbl}>Gender</label>
                <select style={inp} value={tr.gender} onChange={e => setTraveler(i, 'gender', e.target.value)}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => navigate('/clients')} style={{ padding: '9px 20px', border: '0.5px solid #d0d0d0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ padding: '9px 20px', background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          {saving ? 'Saving...' : 'Open Client File'}
        </button>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { Plus, Search, Building2, Car, Bus, Map, Ticket, UtensilsCrossed, Plane, Shield, Star, Phone, Mail, Globe, FileText, X, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import SupplierBookings from '../components/SupplierBookings'

const SUPPLIER_TYPES = [
  { key: 'hotel',     label: 'Hotel',          icon: Building2,       color: '#185FA5', bg: '#E6F1FB' },
  { key: 'car_rental',label: 'Car Rental',     icon: Car,             color: '#0F6E56', bg: '#E1F5EE' },
  { key: 'transfer',  label: 'Transfer',       icon: Bus,             color: '#854F0B', bg: '#FAEEDA' },
  { key: 'day_trip',  label: 'Tour / Day Trip',icon: Map,             color: '#3B6D11', bg: '#EAF3DE' },
  { key: 'entrance',  label: 'Entrance / Site',icon: Ticket,          color: '#534AB7', bg: '#EEEDFE' },
  { key: 'restaurant',label: 'Restaurant',     icon: UtensilsCrossed, color: '#993556', bg: '#FBEAF0' },
  { key: 'airline',   label: 'Airline',        icon: Plane,           color: '#0C447C', bg: '#B5D4F4' },
  { key: 'vip',       label: 'VIP Airport',    icon: Shield,          color: '#B8860B', bg: '#FFF8E6' },
]

const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '0.5px solid #d0d0d0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fafafa' }
const lbl: React.CSSProperties = { fontSize: 11, color: '#555', fontWeight: 500, marginBottom: 4, display: 'block' }

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editSupplier, setEditSupplier] = useState<any>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { loadSuppliers() }, [typeFilter])

  async function loadSuppliers() {
    setLoading(true)
    let q = supabase.from('suppliers').select('*').order('name')
    if (typeFilter !== 'all') q = q.eq('type', typeFilter)
    const { data } = await q
    setSuppliers(data || [])
    setLoading(false)
  }

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  function openEdit(supplier: any) { setEditSupplier(supplier); setShowForm(true) }
  function openNew() { setEditSupplier(null); setShowForm(true) }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Suppliers</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{suppliers.length} suppliers in system</p>
        </div>
        <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <Plus size={15} /> Add Supplier
        </button>
      </div>

      {/* Type filter pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        <button onClick={() => setTypeFilter('all')} style={{ padding: '5px 12px', borderRadius: 20, border: '0.5px solid', fontSize: 11, cursor: 'pointer', fontWeight: typeFilter === 'all' ? 600 : 400, borderColor: typeFilter === 'all' ? '#1a2a3a' : '#e0e0e0', background: typeFilter === 'all' ? '#1a2a3a' : '#fff', color: typeFilter === 'all' ? '#fff' : '#555' }}>
          All
        </button>
        {SUPPLIER_TYPES.map(({ key, label, icon: Icon, color, bg }) => (
          <button key={key} onClick={() => setTypeFilter(key)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, border: `0.5px solid ${typeFilter === key ? color : '#e0e0e0'}`, fontSize: 11, cursor: 'pointer', fontWeight: typeFilter === key ? 600 : 400, background: typeFilter === key ? bg : '#fff', color: typeFilter === key ? color : '#555' }}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, contact, email..." style={{ width: '100%', padding: '7px 10px 7px 32px', border: '0.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
            <div style={{ fontSize: 15, marginBottom: 8 }}>No suppliers found</div>
            <button onClick={openNew} style={{ color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Add first supplier</button>
          </div>
        ) : filtered.map(supplier => {
          const st = SUPPLIER_TYPES.find(t => t.key === supplier.type)
          const isExpanded = expandedId === supplier.id
          return (
            <div key={supplier.id} style={{ borderBottom: '0.5px solid #f8f8f8' }}>
              {/* Supplier row */}
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: st?.bg || '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {st && <st.icon size={18} color={st.color} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{supplier.name}</div>
                    {supplier.rating && <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>{[...Array(supplier.rating)].map((_,i) => <Star key={i} size={11} fill="#f5c842" color="#f5c842" />)}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {supplier.contact_name && <span>👤 {supplier.contact_name}</span>}
                    {supplier.phone && <span>📞 {supplier.phone}</span>}
                    {supplier.email && <span>✉️ {supplier.email}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {st && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: st.bg, color: st.color, fontWeight: 500 }}>{st.label}</span>}
                  <button onClick={() => openEdit(supplier)} style={{ padding: '4px 10px', fontSize: 11, border: '0.5px solid #e0e0e0', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#555' }}>Edit</button>
                  <button onClick={() => setExpandedId(isExpanded ? null : supplier.id)} style={{ padding: '4px 8px', fontSize: 11, border: '0.5px solid #e0e0e0', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#555', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{ padding: '0 16px 14px 68px', background: '#fafafa', borderTop: '0.5px solid #f0f0f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 12 }}>
                    {supplier.website && <div><div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 2 }}>Website</div><a href={supplier.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#185FA5', display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={11} /> {supplier.website}</a></div>}
                    {supplier.registration_number && <div><div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 2 }}>Registration No.</div><div style={{ fontSize: 12, color: '#333' }}>{supplier.registration_number}</div></div>}
                    {supplier.payment_terms && <div><div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 2 }}>Payment Terms</div><div style={{ fontSize: 12, color: '#333' }}>{supplier.payment_terms}</div></div>}
                    {supplier.contract_url && <div><div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 2 }}>Contract / Rates</div><a href={supplier.contract_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#185FA5', display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={11} /> View file</a></div>}
                    {supplier.notes && <div style={{ gridColumn: '1/-1' }}><div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 2 }}>Notes</div><div style={{ fontSize: 12, color: '#333', background: '#fff', border: '0.5px solid #eee', borderRadius: 6, padding: '6px 8px' }}>{supplier.notes}</div></div>}
                  </div>
                  <SupplierBookings supplierId={supplier.id} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <SupplierForm
          supplier={editSupplier}
          onSave={async (data: any) => {
            if (editSupplier) {
              await supabase.from('suppliers').update(data).eq('id', editSupplier.id)
            } else {
              await supabase.from('suppliers').insert(data)
            }
            setShowForm(false)
            loadSuppliers()
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function SupplierForm({ supplier, onSave, onClose }: any) {
  const [f, setF] = useState({
    name: supplier?.name || '',
    type: supplier?.type || 'hotel',
    contact_name: supplier?.contact_name || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    website: supplier?.website || '',
    registration_number: supplier?.registration_number || '',
    payment_terms: supplier?.payment_terms || '',
    contract_url: supplier?.contract_url || '',
    rating: supplier?.rating || 0,
    notes: supplier?.notes || '',
  })
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!f.name) return alert('Please enter supplier name')
    setSaving(true)
    await onSave(f)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,.2)' }}>
        {/* Header */}
        <div style={{ background: '#1a2a3a', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px 16px 0 0' }}>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{supplier ? 'Edit Supplier' : 'Add New Supplier'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7899bb' }}><X size={18} /></button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Type selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Supplier Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
              {SUPPLIER_TYPES.map(({ key, label, icon: Icon, color, bg }) => (
                <button key={key} onClick={() => s('type', key)} style={{ border: f.type === key ? `2px solid ${color}` : '0.5px solid #e0e0e0', borderRadius: 8, padding: '7px 4px', cursor: 'pointer', background: f.type === key ? bg : '#fff', textAlign: 'center', transition: 'all .1s' }}>
                  <Icon size={16} color={f.type === key ? color : '#aaa'} style={{ display: 'block', margin: '0 auto 3px' }} />
                  <span style={{ fontSize: 9, color: f.type === key ? color : '#888', fontWeight: f.type === key ? 600 : 400 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name + Registration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={lbl}>Company Name *</label><input style={inp} value={f.name} onChange={e => s('name', e.target.value)} placeholder="Supplier name" /></div>
            <div><label style={lbl}>Registration No.</label><input style={inp} value={f.registration_number} onChange={e => s('registration_number', e.target.value)} placeholder="Company reg. number" /></div>
          </div>

          {/* Contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={lbl}>Contact Person</label><input style={inp} value={f.contact_name} onChange={e => s('contact_name', e.target.value)} placeholder="Full name" /></div>
            <div><label style={lbl}>Phone</label><input style={inp} value={f.phone} onChange={e => s('phone', e.target.value)} placeholder="+972-50-..." /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={lbl}>Email</label><input style={inp} value={f.email} onChange={e => s('email', e.target.value)} placeholder="email@supplier.com" /></div>
            <div><label style={lbl}>Website</label><input style={inp} value={f.website} onChange={e => s('website', e.target.value)} placeholder="https://..." /></div>
          </div>

          {/* Payment + Contract */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={lbl}>Payment Terms</label>
              <select style={inp} value={f.payment_terms} onChange={e => s('payment_terms', e.target.value)}>
                <option value="">Select...</option>
                <option>Net 30</option>
                <option>Net 60</option>
                <option>Prepaid</option>
                <option>On delivery</option>
                <option>Credit card</option>
                <option>Bank transfer</option>
                <option>Custom</option>
              </select>
            </div>
            <div><label style={lbl}>Contract / Rates file (Google Drive URL)</label><input style={inp} value={f.contract_url} onChange={e => s('contract_url', e.target.value)} placeholder="https://drive.google.com/..." /></div>
          </div>

          {/* Rating */}
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Rating</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1,2,3,4,5].map(r => (
                <button key={r} onClick={() => s('rating', r === f.rating ? 0 : r)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <Star size={22} fill={r <= f.rating ? '#f5c842' : '#e0e0e0'} color={r <= f.rating ? '#f5c842' : '#e0e0e0'} />
                </button>
              ))}
              {f.rating > 0 && <span style={{ fontSize: 12, color: '#888', alignSelf: 'center', marginLeft: 4 }}>{f.rating}/5</span>}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Notes & additional info</label>
            <textarea value={f.notes} onChange={e => s('notes', e.target.value)} placeholder="Payment instructions, special conditions, important contacts..." style={{ ...inp, minHeight: 72, resize: 'vertical', fontFamily: 'inherit' } as React.CSSProperties} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', border: '0.5px solid #d0d0d0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ padding: '9px 20px', background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {saving ? 'Saving...' : supplier ? 'Save Changes' : 'Add Supplier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

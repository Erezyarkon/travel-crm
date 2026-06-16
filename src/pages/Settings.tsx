import React, { useEffect, useState } from 'react'
import { Building2, Save, Check } from 'lucide-react'
import { CompanySettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from '../lib/companySettings'

const CURRENCIES = ['USD', 'EUR', 'ILS', 'GBP']

export default function Settings() {
  const [form, setForm] = useState<CompanySettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const s = await loadSettings()
      setForm(s)
      setLoading(false)
    }
    load()
  }, [])

  function set<K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const ok = await saveSettings(form)
    setSaving(false)
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      setError('Could not save. Make sure the "settings" table exists in Supabase.')
    }
  }

  const label: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 5, display: 'block' }
  const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', border: '0.5px solid #d0d0d0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fafafa' }
  const hint: React.CSSProperties = { fontSize: 11, color: '#aaa', marginTop: 4 }

  if (loading) {
    return <div style={{ padding: 24, color: '#888', fontSize: 13 }}>Loading settings…</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Settings</h1>
        <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Company details used across the CRM and on vouchers</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={16} color="#185FA5" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Company Information</span>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={label}>Company Name</label>
            <input style={inp} value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="EYT Erezyarkon Travel" />
            <div style={hint}>Shown in the voucher header and footer.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={label}>Phone</label>
              <input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+972-50-000-0000" />
            </div>
            <div>
              <label style={label}>Email</label>
              <input style={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="erez@erezyarkon.com" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={label}>Website</label>
              <input style={inp} value={form.website} onChange={e => set('website', e.target.value)} placeholder="erezyarkon.com" />
            </div>
            <div>
              <label style={label}>Default Currency</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.default_currency} onChange={e => set('default_currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={label}>Address</label>
            <input style={inp} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Optional — appears on vouchers if set" />
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '0.5px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: saved ? '#0F6E56' : '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: saving ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, opacity: saving ? 0.7 : 1 }}
          >
            {saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}</>}
          </button>
          {error && <span style={{ fontSize: 12, color: '#A32D2D' }}>{error}</span>}
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: '#aaa' }}>
        Travel CRM · v1.0 · GitHub + Vercel
      </div>
    </div>
  )
}

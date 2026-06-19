import React, { useEffect, useState } from 'react'
import { Building2, Save, Check, Users, UserPlus, KeyRound, Receipt } from 'lucide-react'
import { CompanySettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from '../lib/companySettings'
import { useAuth, Profile, Role } from '../lib/auth'
import { listProfiles, createUser, updateUserRole, sendPasswordReset } from '../lib/team'

const CURRENCIES = ['USD', 'EUR', 'ILS', 'GBP']
const ROLE_COLORS: Record<Role, { bg: string; color: string }> = {
  admin: { bg: '#FAEEDA', color: '#854F0B' },
  agent: { bg: '#E6F1FB', color: '#185FA5' },
  viewer: { bg: '#F1EFE8', color: '#5F5E5A' },
}

export default function Settings() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  // ---- Company info ----
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
    setSaving(true); setError('')
    const ok = await saveSettings(form)
    setSaving(false)
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    else setError('Could not save. Make sure the "settings" table exists in Supabase.')
  }

  const label: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 5, display: 'block' }
  const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', border: '0.5px solid #d0d0d0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fafafa' }
  const hint: React.CSSProperties = { fontSize: 11, color: '#aaa', marginTop: 4 }
  const card: React.CSSProperties = { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }
  const head: React.CSSProperties = { padding: '14px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }

  if (loading) {
    return <div style={{ padding: 24, color: '#888', fontSize: 13 }}>Loading settings…</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Settings</h1>
        <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Company details and team management</p>
      </div>

      {/* Company info */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={head}>
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
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: saved ? '#0F6E56' : '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: saving ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, opacity: saving ? 0.7 : 1 }}>
            {saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}</>}
          </button>
          {error && <span style={{ fontSize: 12, color: '#A32D2D' }}>{error}</span>}
        </div>
      </div>

      {/* Business & Invoicing */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={head}>
          <Receipt size={16} color="#854F0B" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Business &amp; Invoicing</span>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={label}>Legal / Registered Name</label>
              <input style={inp} value={form.legal_name} onChange={e => set('legal_name', e.target.value)} placeholder="Company Ltd." />
            </div>
            <div>
              <label style={label}>Business Number (ח.פ. / ע.מ.)</label>
              <input style={inp} value={form.business_number} onChange={e => set('business_number', e.target.value)} placeholder="515123456" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={label}>Business Type</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.business_type} onChange={e => set('business_type', e.target.value)}>
                <option value="ltd">Company (Ltd. / בע"מ)</option>
                <option value="licensed">Licensed Dealer (עוסק מורשה)</option>
                <option value="exempt">Exempt Dealer (עוסק פטור)</option>
              </select>
            </div>
            <div>
              <label style={label}>VAT Rate (%)</label>
              <input style={inp} type="number" value={form.vat_percent} onChange={e => set('vat_percent', Number(e.target.value) as any)} placeholder="18" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={label}>Invoice Prefix</label>
              <input style={inp} value={form.invoice_prefix} onChange={e => set('invoice_prefix', e.target.value)} placeholder="INV" />
            </div>
            <div>
              <label style={label}>Next Invoice Number</label>
              <input style={inp} type="number" value={form.next_invoice_number} onChange={e => set('next_invoice_number', Number(e.target.value) as any)} placeholder="1001" />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.default_vat_on} onChange={e => set('default_vat_on', e.target.checked as any)} />
            Add VAT by default on new invoices
            <span style={{ fontSize: 11, color: '#aaa' }}>(tourism is usually 0% — leave off)</span>
          </label>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '0.5px solid #f0f0f0' }}>
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: saved ? '#0F6E56' : '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: saving ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, opacity: saving ? 0.7 : 1 }}>
            {saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}</>}
          </button>
        </div>
      </div>

      {/* Team management — admins only */}
      {isAdmin && <TeamSection />}

      <div style={{ marginTop: 16, fontSize: 11, color: '#aaa' }}>Travel CRM · v1.0 · GitHub + Vercel</div>
    </div>
  )
}

function TeamSection() {
  const { profile } = useAuth()
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  // new user form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('agent')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function refresh() {
    setLoading(true)
    setMembers(await listProfiles())
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  async function handleAdd() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setMsg({ type: 'err', text: 'Fill all fields. Password must be at least 6 characters.' })
      return
    }
    setBusy(true); setMsg(null)
    const { error } = await createUser({ full_name: name, email, password, role })
    setBusy(false)
    if (error) { setMsg({ type: 'err', text: error }); return }
    setMsg({ type: 'ok', text: `${name} was added.` })
    setName(''); setEmail(''); setPassword(''); setRole('agent')
    setShowAdd(false)
    refresh()
  }

  async function handleRoleChange(id: string, newRole: Role) {
    await updateUserRole(id, newRole)
    refresh()
  }

  async function handleReset(memberEmail: string) {
    const { error } = await sendPasswordReset(memberEmail)
    setMsg(error ? { type: 'err', text: error } : { type: 'ok', text: `Password reset email sent to ${memberEmail}.` })
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', border: '0.5px solid #d0d0d0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fafafa' }
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 5, display: 'block' }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} color="#185FA5" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Team</span>
        </div>
        <button onClick={() => { setShowAdd(s => !s); setMsg(null) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: showAdd ? '#fff' : '#1a2a3a', color: showAdd ? '#555' : '#fff', border: showAdd ? '0.5px solid #d0d0d0' : 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
          {showAdd ? 'Cancel' : <><UserPlus size={14} /> Add User</>}
        </button>
      </div>

      {showAdd && (
        <div style={{ padding: 20, borderBottom: '0.5px solid #f0f0f0', background: '#fafafa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={label}>Full Name</label><input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Agent name" /></div>
            <div><label style={label}>Email</label><input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="agent@erezyarkon.com" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div><label style={label}>Temporary Password</label><input style={inp} type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" /></div>
            <div>
              <label style={label}>Role</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={role} onChange={e => setRole(e.target.value as Role)}>
                <option value="agent">Agent</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>
          <button onClick={handleAdd} disabled={busy}
            style={{ background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: busy ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Creating…' : 'Create User'}
          </button>
        </div>
      )}

      {msg && (
        <div style={{ padding: '10px 16px', fontSize: 12, background: msg.type === 'ok' ? '#EAF3DE' : '#FBEAEA', color: msg.type === 'ok' ? '#3B6D11' : '#A32D2D', borderBottom: '0.5px solid #f0f0f0' }}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Loading team…</div>
      ) : members.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No team members yet.</div>
      ) : members.map(m => {
        const rc = ROLE_COLORS[m.role] || ROLE_COLORS.viewer
        const isSelf = m.id === profile?.id
        return (
          <div key={m.id} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '0.5px solid #f8f8f8' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#185FA5', flexShrink: 0 }}>
              {m.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{m.full_name} {isSelf && <span style={{ color: '#aaa', fontWeight: 400 }}>(you)</span>}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{m.email}</div>
            </div>
            <select value={m.role} disabled={isSelf}
              onChange={e => handleRoleChange(m.id, e.target.value as Role)}
              style={{ fontSize: 11, padding: '4px 8px', borderRadius: 20, border: 'none', background: rc.bg, color: rc.color, fontWeight: 600, cursor: isSelf ? 'default' : 'pointer', opacity: isSelf ? 0.7 : 1 }}>
              <option value="admin">Administrator</option>
              <option value="agent">Agent</option>
              <option value="viewer">Viewer</option>
            </select>
            <button onClick={() => handleReset(m.email)} title="Send password reset email"
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '0.5px solid #e0e0e0', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 11, color: '#555' }}>
              <KeyRound size={12} /> Reset
            </button>
          </div>
        )
      })}
    </div>
  )
}

import React, { useState } from 'react'
import { Plane } from 'lucide-react'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) setError('Incorrect email or password.')
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '0.5px solid #d0d0d0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fafafa' }
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6, display: 'block' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16, border: '0.5px solid #e5e5e5', padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ background: '#f5c842', borderRadius: 12, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Plane size={24} color="#1a1a00" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a2a3a' }}>Travel CRM</h1>
          <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} placeholder="you@erezyarkon.com" autoComplete="email" required />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inp} placeholder="••••••••" autoComplete="current-password" required />
          </div>

          {error && <div style={{ fontSize: 12, color: '#A32D2D', marginBottom: 12, marginTop: 4 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 12, background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', cursor: loading ? 'default' : 'pointer', fontWeight: 600, fontSize: 14, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

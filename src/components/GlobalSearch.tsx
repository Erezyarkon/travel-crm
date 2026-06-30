import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, User, CalendarDays, X, Building2, Command,
  LayoutDashboard, Users2, CalendarRange, BarChart3, Settings, Plus, CornerDownLeft,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Result {
  type: 'client' | 'booking' | 'supplier' | 'page' | 'action'
  id: string
  clientId?: string
  title: string
  subtitle: string
  action?: () => void
}

const PAGE_SHORTCUTS: { label: string; subtitle: string; to: string; icon: any }[] = [
  { label: 'Dashboard', subtitle: 'Go to page', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', subtitle: 'Go to page', to: '/clients', icon: User },
  { label: 'Groups', subtitle: 'Go to page', to: '/groups', icon: Users2 },
  { label: 'Bookings', subtitle: 'Go to page', to: '/bookings', icon: CalendarDays },
  { label: 'Calendar', subtitle: 'Go to page', to: '/calendar', icon: CalendarRange },
  { label: 'Suppliers', subtitle: 'Go to page', to: '/suppliers', icon: Building2 },
  { label: 'Reports', subtitle: 'Go to page', to: '/reports', icon: BarChart3 },
  { label: 'Settings', subtitle: 'Go to page', to: '/settings', icon: Settings },
]

const TYPE_META: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  client:   { color: '#185FA5', bg: '#E6F1FB', icon: User,        label: 'client' },
  booking:  { color: '#854F0B', bg: '#FAEEDA', icon: CalendarDays, label: 'booking' },
  supplier: { color: '#534AB7', bg: '#EEEDFE', icon: Building2,   label: 'supplier' },
  page:     { color: '#0F6E56', bg: '#E1F5EE', icon: Command,     label: 'go to' },
  action:   { color: '#A32D2D', bg: '#FBEAEA', icon: Plus,        label: 'action' },
}

export default function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 10)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const matchingPages = useCallback((q: string): Result[] => {
    if (!q) return []
    const lower = q.toLowerCase()
    return PAGE_SHORTCUTS
      .filter(p => p.label.toLowerCase().includes(lower))
      .map(p => ({
        type: 'page' as const, id: p.to, title: p.label, subtitle: p.subtitle,
        action: () => navigate(p.to),
      }))
  }, [navigate])

  // Debounced search across clients, bookings, suppliers
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      // show quick nav + new client action when box opened empty
      setResults(q.length === 0 ? [
        { type: 'action', id: 'new-client', title: 'New Client File', subtitle: 'Create a new client', action: () => navigate('/clients/new') },
        ...PAGE_SHORTCUTS.slice(0, 6).map(p => ({ type: 'page' as const, id: p.to, title: p.label, subtitle: p.subtitle, action: () => navigate(p.to) })),
      ] : [])
      setLoading(false)
      return
    }
    setLoading(true)
    const handle = setTimeout(async () => {
      const [{ data: clients }, { data: bookings }, { data: suppliers }] = await Promise.all([
        supabase.from('clients')
          .select('id, full_name, phone, email, file_number')
          .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,file_number.ilike.%${q}%`)
          .limit(5),
        supabase.from('bookings')
          .select('id, client_id, service_name, file_number, type, clients(full_name)')
          .or(`service_name.ilike.%${q}%,file_number.ilike.%${q}%`)
          .limit(5),
        supabase.from('suppliers')
          .select('id, name, type, phone, email')
          .ilike('name', `%${q}%`)
          .limit(4),
      ])

      const r: Result[] = []
      ;(clients || []).forEach((c: any) => r.push({
        type: 'client', id: c.id, clientId: c.id,
        title: c.full_name,
        subtitle: [c.file_number, c.phone || c.email].filter(Boolean).join(' · '),
        action: () => navigate(`/clients/${c.id}`),
      }))
      ;(bookings || []).forEach((b: any) => r.push({
        type: 'booking', id: b.id, clientId: b.client_id,
        title: b.service_name || 'Booking',
        subtitle: [b.clients?.full_name, b.file_number].filter(Boolean).join(' · '),
        action: () => navigate(`/clients/${b.client_id}`),
      }))
      ;(suppliers || []).forEach((s: any) => r.push({
        type: 'supplier', id: s.id, title: s.name,
        subtitle: [s.type, s.phone || s.email].filter(Boolean).join(' · '),
        action: () => navigate('/suppliers'),
      }))

      // Append matching page shortcuts at the end
      const pages = matchingPages(q)

      setResults([...r, ...pages])
      setActiveIdx(0)
      setLoading(false)
    }, 220)
    return () => clearTimeout(handle)
  }, [query, navigate, matchingPages])

  function go(r: Result) {
    r.action?.()
    setQuery(''); setResults([]); setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[activeIdx]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  const showDropdown = open

  return (
    <div ref={boxRef} style={{ position: 'relative', maxWidth: 480, width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search clients, bookings, suppliers…"
          style={{ width: '100%', padding: '9px 70px 9px 34px', border: '0.5px solid #e0e0e0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
        />
        {query ? (
          <button onClick={() => { setQuery(''); setResults([]) }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', display: 'flex', padding: 2 }}>
            <X size={15} />
          </button>
        ) : (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 2, background: '#f3f4f6', borderRadius: 5, padding: '2px 6px', pointerEvents: 'none' }}>
            <Command size={10} color="#999" />
            <span style={{ fontSize: 10, color: '#999', fontWeight: 600 }}>K</span>
          </span>
        )}
      </div>

      {showDropdown && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', boxShadow: '0 8px 28px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden', maxHeight: 420, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 18, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Searching…</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 18, textAlign: 'center', color: '#aaa', fontSize: 13 }}>
              {query.trim().length >= 2 ? `No matches for "${query}"` : 'Start typing to search'}
            </div>
          ) : (
            <>
              {!query && (
                <div style={{ padding: '8px 14px 4px', fontSize: 10, color: '#aaa', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Quick actions</div>
              )}
              {results.map((r, i) => {
                const meta = TYPE_META[r.type]
                const Icon = meta.icon
                return (
                  <div key={`${r.type}-${r.id}`}
                    onClick={() => go(r)}
                    onMouseEnter={() => setActiveIdx(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px', cursor: 'pointer', background: i === activeIdx ? '#f5f8fb' : '#fff', borderBottom: '0.5px solid #f5f5f5' }}>
                    <div style={{ background: meta.bg, borderRadius: 8, padding: 6, flexShrink: 0 }}>
                      <Icon size={14} color={meta.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subtitle}</div>
                    </div>
                    {i === activeIdx ? (
                      <CornerDownLeft size={13} color="#bbb" style={{ flexShrink: 0 }} />
                    ) : (
                      <span style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 0 }}>{meta.label}</span>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}

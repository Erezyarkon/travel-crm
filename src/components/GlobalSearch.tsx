import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, CalendarDays, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Result {
  type: 'client' | 'booking'
  id: string
  clientId: string
  title: string
  subtitle: string
}

export default function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Debounced search
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    const handle = setTimeout(async () => {
      // Clients: name, phone, email, file number. RLS limits agents to their own.
      const [{ data: clients }, { data: bookings }] = await Promise.all([
        supabase.from('clients')
          .select('id, full_name, phone, email, file_number')
          .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,file_number.ilike.%${q}%`)
          .limit(6),
        supabase.from('bookings')
          .select('id, client_id, service_name, file_number, type, clients(full_name)')
          .or(`service_name.ilike.%${q}%,file_number.ilike.%${q}%`)
          .limit(6),
      ])

      const r: Result[] = []
      ;(clients || []).forEach((c: any) => r.push({
        type: 'client', id: c.id, clientId: c.id,
        title: c.full_name,
        subtitle: [c.file_number, c.phone || c.email].filter(Boolean).join(' · '),
      }))
      ;(bookings || []).forEach((b: any) => r.push({
        type: 'booking', id: b.id, clientId: b.client_id,
        title: b.service_name || 'Booking',
        subtitle: [b.clients?.full_name, b.file_number].filter(Boolean).join(' · '),
      }))

      setResults(r)
      setActiveIdx(0)
      setLoading(false)
    }, 250)
    return () => clearTimeout(handle)
  }, [query])

  function go(r: Result) {
    navigate(`/clients/${r.clientId}`)
    setQuery(''); setResults([]); setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[activeIdx]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div ref={boxRef} style={{ position: 'relative', maxWidth: 480, width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search clients, bookings, file numbers…"
          style={{ width: '100%', padding: '9px 34px', border: '0.5px solid #e0e0e0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]) }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', display: 'flex', padding: 2 }}>
            <X size={15} />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', boxShadow: '0 8px 28px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden', maxHeight: 380, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 18, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Searching…</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 18, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No matches for “{query}”</div>
          ) : results.map((r, i) => (
            <div key={`${r.type}-${r.id}`}
              onClick={() => go(r)}
              onMouseEnter={() => setActiveIdx(i)}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px', cursor: 'pointer', background: i === activeIdx ? '#f5f8fb' : '#fff', borderBottom: '0.5px solid #f5f5f5' }}>
              <div style={{ background: r.type === 'client' ? '#E6F1FB' : '#FAEEDA', borderRadius: 8, padding: 6, flexShrink: 0 }}>
                {r.type === 'client' ? <User size={14} color="#185FA5" /> : <CalendarDays size={14} color="#854F0B" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subtitle}</div>
              </div>
              <span style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 0 }}>{r.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Download, Users, LayoutGrid, List as ListIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import EmptyState from '../components/EmptyState'
import { CLIENT_STATUS as statusInfoShared, StatusBadge } from '../lib/status'
import { exportToCsv } from '../lib/exportCsv'
import { SkeletonRows } from '../components/Skeleton'

export default function Clients() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState('created')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!profile) return
      setLoading(true)
      let q = supabase.from('clients').select('*').order('created_at', { ascending: false })
      if (statusFilter !== 'all') q = q.eq('status', statusFilter)
      // Agents only see clients they own. Admins and viewers see everything.
      if (profile.role === 'agent') q = q.eq('owner_id', profile.id)
      const { data } = await q
      setClients(data || [])
      setLoading(false)
    }
    load()
  }, [statusFilter, profile])

  const filtered = clients.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.file_number?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    let va: any, vb: any
    switch (sortKey) {
      case 'name': va = (a.full_name || '').toLowerCase(); vb = (b.full_name || '').toLowerCase(); break
      case 'file': va = a.file_number || ''; vb = b.file_number || ''; break
      case 'status': va = a.status || ''; vb = b.status || ''; break
      case 'created': va = a.created_at || ''; vb = b.created_at || ''; break
      default: va = ''; vb = ''
    }
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })

  const statusInfo = statusInfoShared

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Clients</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{clients.length} clients in system</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => exportToCsv('clients', filtered, [
            { header: 'File Number', value: c => c.file_number },
            { header: 'Full Name', value: c => c.full_name },
            { header: 'Phone', value: c => c.phone },
            { header: 'Email', value: c => c.email },
            { header: 'Status', value: c => c.status },
            { header: 'Nationality', value: c => c.nationality },
            { header: 'Passport', value: c => c.passport_number },
            { header: 'Created', value: c => c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : '' },
          ])} disabled={filtered.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#555', border: '0.5px solid #d0d0d0', borderRadius: 8, padding: '9px 14px', cursor: filtered.length === 0 ? 'default' : 'pointer', fontWeight: 500, fontSize: 13, opacity: filtered.length === 0 ? 0.5 : 1 }}>
            <Download size={15} /> Export
          </button>
          <button onClick={() => navigate('/clients/new')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <Plus size={15} /> New Client File
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, file number, phone, email..." style={{ width: '100%', padding: '7px 10px 7px 32px', border: '0.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'lead', 'active', 'past'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 12px', borderRadius: 20, border: '0.5px solid', fontSize: 12, cursor: 'pointer', fontWeight: statusFilter === s ? 600 : 400, borderColor: statusFilter === s ? '#1a2a3a' : '#e0e0e0', background: statusFilter === s ? '#1a2a3a' : '#fff', color: statusFilter === s ? '#fff' : '#555' }}>
                {s === 'all' ? 'All' : statusInfo[s]?.label}
              </button>
            ))}
          </div>
          <select
            value={`${sortKey}:${sortDir}`}
            onChange={e => { const [k, d] = e.target.value.split(':'); setSortKey(k); setSortDir(d as 'asc' | 'desc') }}
            style={{ padding: '7px 10px', border: '0.5px solid #e0e0e0', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', cursor: 'pointer', color: '#555' }}
            title="Sort"
          >
            <option value="created:desc">Newest first</option>
            <option value="created:asc">Oldest first</option>
            <option value="name:asc">Name A–Z</option>
            <option value="name:desc">Name Z–A</option>
            <option value="file:asc">File # ↑</option>
            <option value="file:desc">File # ↓</option>
            <option value="status:asc">Status</option>
          </select>
          <div style={{ display: 'flex', border: '0.5px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={() => setView('list')} title="List view"
              style={{ padding: '7px 9px', border: 'none', background: view === 'list' ? '#1a2a3a' : '#fff', color: view === 'list' ? '#fff' : '#888', cursor: 'pointer', display: 'flex' }}>
              <ListIcon size={15} />
            </button>
            <button onClick={() => setView('grid')} title="Card view"
              style={{ padding: '7px 9px', border: 'none', background: view === 'grid' ? '#1a2a3a' : '#fff', color: view === 'grid' ? '#fff' : '#888', cursor: 'pointer', display: 'flex', borderLeft: '0.5px solid #e0e0e0' }}>
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>

        {loading ? (
          <SkeletonRows rows={7} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title={search ? 'No clients match your search' : 'No clients yet'} hint={search ? 'Try a different name, phone or email.' : 'Create your first client file to get started.'} action={search ? undefined : { label: '+ New Client File', onClick: () => navigate('/clients/new') }} />
        ) : view === 'grid' ? (
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {filtered.map((c) => (
              <div key={c.id} onClick={() => navigate(`/clients/${c.id}`)}
                style={{ border: '0.5px solid #eee', borderRadius: 12, padding: 16, cursor: 'pointer', background: '#fff', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: '#185FA5', flexShrink: 0 }}>
                    {c.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.full_name}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{c.file_number}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: '#888', lineHeight: 1.6, marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.phone && <div>{c.phone}</div>}
                  {c.email && <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</div>}
                </div>
                <StatusBadge status={c.status} kind="client" />
              </div>
            ))}
          </div>
        ) : filtered.map((c) => (
          <div key={c.id} onClick={() => navigate(`/clients/${c.id}`)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderBottom: '0.5px solid #f8f8f8' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#185FA5', flexShrink: 0 }}>
              {c.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{c.full_name}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{c.phone} · {c.email}</div>
            </div>
            <div style={{ fontSize: 12, color: '#aaa', minWidth: 80, textAlign: 'center' }}>{c.file_number}</div>
            <span style={{ minWidth: 50, textAlign: 'center' }}>
              <StatusBadge status={c.status} kind="client" />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

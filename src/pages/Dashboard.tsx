import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, CalendarDays, DollarSign, TrendingUp, Plus, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ clients: 0, bookings: 0, revenue: 0, leads: 0 })
  const [recentClients, setRecentClients] = useState<any[]>([])
  const [recentBookings, setRecentBookings] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const [{ count: clients }, { count: bookings }, { data: rev }, { count: leads }, { data: rc }, { data: rb }] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('total_price').eq('status', 'paid'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'lead'),
        supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5),
      ])
      const revenue = rev?.reduce((s: number, r: any) => s + (r.total_price || 0), 0) || 0
      setStats({ clients: clients || 0, bookings: bookings || 0, revenue, leads: leads || 0 })
      setRecentClients(rc || [])
      setRecentBookings(rb || [])
    }
    load()
  }, [])

  const statCards = [
    { label: 'Total Clients', value: stats.clients, icon: Users, color: '#185FA5', bg: '#E6F1FB' },
    { label: 'Active Leads', value: stats.leads, icon: TrendingUp, color: '#0F6E56', bg: '#E1F5EE' },
    { label: 'Total Bookings', value: stats.bookings, icon: CalendarDays, color: '#854F0B', bg: '#FAEEDA' },
    { label: 'Revenue (USD)', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: '#3B6D11', bg: '#EAF3DE' },
  ]

  const statusColors: Record<string, string> = {
    inquiry: '#888', quoted: '#854F0B', confirmed: '#185FA5',
    paid: '#3B6D11', voucher_sent: '#0F6E56', completed: '#0F6E56', cancelled: '#A32D2D'
  }
  const statusLabels: Record<string, string> = {
    inquiry: 'Inquiry', quoted: 'Quoted', confirmed: 'Confirmed',
    paid: 'Paid', voucher_sent: 'Voucher Sent', completed: 'Completed', cancelled: 'Cancelled'
  }
  const clientStatusInfo: Record<string, { label: string; bg: string; color: string }> = {
    lead: { label: 'Lead', bg: '#E1F5EE', color: '#0F6E56' },
    active: { label: 'Active', bg: '#E6F1FB', color: '#185FA5' },
    past: { label: 'Past', bg: '#F1EFE8', color: '#5F5E5A' },
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Dashboard</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Welcome to Travel CRM</p>
        </div>
        <button onClick={() => navigate('/clients/new')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <Plus size={15} /> New Client File
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
              <div style={{ background: bg, borderRadius: 8, padding: 6 }}><Icon size={16} color={color} /></div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Recent Clients</span>
            <button onClick={() => navigate('/clients')} style={{ background: 'none', border: 'none', color: '#185FA5', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>All Clients <ArrowLeft size={12} /></button>
          </div>
          {recentClients.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>
              No clients yet. <button onClick={() => navigate('/clients/new')} style={{ color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Add first client</button>
            </div>
          ) : recentClients.map((c) => (
            <div key={c.id} onClick={() => navigate(`/clients/${c.id}`)} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: '0.5px solid #f8f8f8' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#185FA5' }}>
                {c.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.full_name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{c.file_number}</div>
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: clientStatusInfo[c.status]?.bg, color: clientStatusInfo[c.status]?.color, fontWeight: 500 }}>
                {clientStatusInfo[c.status]?.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Recent Bookings</span>
            <button onClick={() => navigate('/bookings')} style={{ background: 'none', border: 'none', color: '#185FA5', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>All Bookings <ArrowLeft size={12} /></button>
          </div>
          {recentBookings.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No bookings yet.</div>
          ) : recentBookings.map((b) => (
            <div key={b.id} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '0.5px solid #f8f8f8' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{b.service_name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{b.file_number} · ${b.total_price}</div>
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f0f0f0', color: statusColors[b.status] || '#888', fontWeight: 500 }}>
                {statusLabels[b.status] || b.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

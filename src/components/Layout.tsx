import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarDays, Building2, BarChart3, Settings, Plane, Plus } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'דשבורד' },
  { to: '/clients', icon: Users, label: 'לקוחות' },
  { to: '/bookings', icon: CalendarDays, label: 'הזמנות' },
  { to: '/suppliers', icon: Building2, label: 'ספקים' },
  { to: '/reports', icon: BarChart3, label: 'דוחות' },
  { to: '/settings', icon: Settings, label: 'הגדרות' },
]

export default function Layout() {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl' }}>
      <aside style={{ width: 200, background: '#1a2a3a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #2d3f50' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: '#f5c842', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plane size={16} color="#1a1a00" />
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Travel CRM</div>
              <div style={{ color: '#7899bb', fontSize: 10 }}>erezyarkon.com</div>
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/clients/new')} style={{ margin: '12px 12px 4px', background: '#f5c842', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12, color: '#1a1a00' }}>
          <Plus size={14} /> תיק לקוח חדש
        </button>

        <nav style={{ flex: 1, padding: '8px 0' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              color: isActive ? '#fff' : '#7899bb', background: isActive ? '#2d3f50' : 'transparent',
              borderRight: isActive ? '3px solid #f5c842' : '3px solid transparent',
              fontSize: 13, transition: 'all 0.15s'
            })}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid #2d3f50', color: '#7899bb', fontSize: 10 }}>
          v1.0 · GitHub + Vercel
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

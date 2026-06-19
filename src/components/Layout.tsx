import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarDays, CalendarRange, Building2, BarChart3, Settings, Plane, Plus, LogOut } from 'lucide-react'
import { useAuth } from '../lib/auth'
import GlobalSearch from './GlobalSearch'

const ROLE_LABELS: Record<string, string> = { admin: 'Administrator', agent: 'Agent', viewer: 'Viewer' }

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients',   icon: Users,           label: 'Clients' },
  { to: '/bookings',  icon: CalendarDays,    label: 'Bookings' },
  { to: '/calendar',  icon: CalendarRange,   label: 'Calendar' },
  { to: '/suppliers', icon: Building2,       label: 'Suppliers' },
  { to: '/reports',   icon: BarChart3,       label: 'Reports' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
]

export default function Layout() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
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

        <button onClick={() => navigate('/clients/new')} style={{ margin: '12px 12px 4px', background: '#f5c842', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12, color: '#1a1a00', justifyContent: 'center' }}>
          <Plus size={14} /> New Client File
        </button>

        <nav style={{ flex: 1, padding: '8px 0' }}>
          {navItems.filter(({ to }) => to !== '/settings' || profile?.role === 'admin').map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              color: isActive ? '#fff' : '#7899bb',
              background: isActive ? '#2d3f50' : 'transparent',
              borderLeft: isActive ? '3px solid #f5c842' : '3px solid transparent',
              fontSize: 13, transition: 'all 0.15s',
            })}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid #2d3f50' }}>
          {profile && (
            <div style={{ padding: '12px 16px 8px' }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.full_name}</div>
              <div style={{ color: '#7899bb', fontSize: 10 }}>{ROLE_LABELS[profile.role] || profile.role}</div>
            </div>
          )}
          <button onClick={() => signOut()} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'transparent', border: 'none', color: '#7899bb', fontSize: 13, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7899bb')}>
            <LogOut size={16} /> Sign Out
          </button>
          <div style={{ padding: '8px 16px 12px', color: '#566b80', fontSize: 10, textAlign: 'center' }}>
            v1.0 · GitHub + Vercel
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(247,248,250,0.85)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid #e8e8e8', padding: '10px 24px', display: 'flex', justifyContent: 'center' }}>
          <GlobalSearch />
        </div>
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

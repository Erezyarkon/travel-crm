import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarDays, Building2, BarChart3, Settings, Plane, Plus, Globe } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, he: 'דשבורד',  en: 'Dashboard' },
  { to: '/clients',   icon: Users,           he: 'לקוחות',  en: 'Clients' },
  { to: '/bookings',  icon: CalendarDays,    he: 'הזמנות',  en: 'Bookings' },
  { to: '/suppliers', icon: Building2,       he: 'ספקים',   en: 'Suppliers' },
  { to: '/reports',   icon: BarChart3,       he: 'דוחות',   en: 'Reports' },
  { to: '/settings',  icon: Settings,        he: 'הגדרות',  en: 'Settings' },
]

export default function Layout() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'he'|'en'>('he')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: lang === 'he' ? 'rtl' : 'ltr' }}>
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
          <Plus size={14} /> {lang === 'he' ? 'תיק לקוח חדש' : 'New Client File'}
        </button>

        <nav style={{ flex: 1, padding: '8px 0' }}>
          {navItems.map(({ to, icon: Icon, he, en }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              color: isActive ? '#fff' : '#7899bb', background: isActive ? '#2d3f50' : 'transparent',
              borderRight: lang === 'he' && isActive ? '3px solid #f5c842' : 'none',
              borderLeft: lang === 'en' && isActive ? '3px solid #f5c842' : 'none',
              fontSize: 13, transition: 'all 0.15s',
            })}>
              <Icon size={16} />
              <span>{lang === 'he' ? he : en}</span>
            </NavLink>
          ))}
        </nav>

        <button onClick={() => setLang(l => l === 'he' ? 'en' : 'he')} style={{ margin: '8px 12px', background: '#2d3f50', border: '0.5px solid #3a5270', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#aabbcc', justifyContent: 'center' }}>
          <Globe size={13} /> {lang === 'he' ? 'English' : 'עברית'}
        </button>

        <div style={{ padding: '10px 16px', borderTop: '1px solid #2d3f50', color: '#7899bb', fontSize: 10, textAlign: 'center' }}>
          v1.0 · GitHub + Vercel
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

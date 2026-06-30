import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientCard from './pages/ClientCard'
import NewClient from './pages/NewClient'
import Bookings from './pages/Bookings'
import Calendar from './pages/Calendar'
import Suppliers from './pages/Suppliers'
import Groups from './pages/Groups'
import GroupCard from './pages/GroupCard'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './lib/auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from './lib/toast'
import './App.css'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 14 }}>Loading…</div>
  }

  if (!user) {
    return <Login />
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/new" element={<NewClient />} />
        <Route path="clients/:id" element={<ClientCard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="groups" element={<Groups />} />
        <Route path="groups/:id" element={<GroupCard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,        // data considered fresh for 1 minute — no refetch on quick nav
      gcTime: 5 * 60_000,       // keep cached data 5 minutes after last use
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App

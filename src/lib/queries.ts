// Centralized React Query hooks for the most frequently fetched CRM data.
// Goal: instant page-to-page navigation by caching reads, with automatic
// background refresh and easy, explicit invalidation after writes.

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { Profile } from './auth'

// ---- Query keys (centralized so invalidation stays consistent) ----
export const qk = {
  clients: (ownerId?: string | null) => ['clients', ownerId ?? 'all'] as const,
  client: (id: string) => ['client', id] as const,
  bookings: (ownerScope?: string | null) => ['bookings', ownerScope ?? 'all'] as const,
  clientBookings: (clientId: string) => ['bookings', 'client', clientId] as const,
  clientTravelers: (clientId: string) => ['travelers', clientId] as const,
  suppliers: () => ['suppliers'] as const,
  groups: () => ['groups'] as const,
  openTasks: () => ['tasks', 'open'] as const,
}

// ---- Clients ----
export function useClients(profile: Profile | null) {
  const isAgent = profile?.role === 'agent'
  return useQuery({
    queryKey: qk.clients(isAgent ? profile?.id : null),
    queryFn: async () => {
      let q = supabase.from('clients').select('*').order('created_at', { ascending: false })
      if (isAgent && profile) q = q.eq('owner_id', profile.id)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
    enabled: !!profile,
  })
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: qk.client(id || ''),
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// ---- Bookings ----
export function useBookings(profile: Profile | null, clientIds?: string[]) {
  const isAgent = profile?.role === 'agent'
  return useQuery({
    queryKey: qk.bookings(isAgent ? profile?.id : null),
    queryFn: async () => {
      let q = supabase.from('bookings').select('*')
      if (isAgent && clientIds) {
        q = clientIds.length === 0
          ? q.eq('client_id', '00000000-0000-0000-0000-000000000000')
          : q.in('client_id', clientIds)
      }
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
    enabled: !!profile,
  })
}

export function useClientBookings(clientId: string | undefined) {
  return useQuery({
    queryKey: qk.clientBookings(clientId || ''),
    queryFn: async () => {
      const { data, error } = await supabase.from('bookings').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!clientId,
  })
}

export function useClientTravelers(clientId: string | undefined) {
  return useQuery({
    queryKey: qk.clientTravelers(clientId || ''),
    queryFn: async () => {
      const { data, error } = await supabase.from('travelers').select('*').eq('client_id', clientId)
      if (error) throw error
      return data || []
    },
    enabled: !!clientId,
  })
}

// ---- Suppliers (rarely change — long stale time) ----
export function useSuppliers() {
  return useQuery({
    queryKey: qk.suppliers(),
    queryFn: async () => {
      const { data, error } = await supabase.from('suppliers').select('*').order('name')
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60_000,
  })
}

// ---- Groups ----
export function useGroups() {
  return useQuery({
    queryKey: qk.groups(),
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })
}

// ---- Invalidation helpers (call after mutations) ----
export function useCrmInvalidation() {
  const qc = useQueryClient()
  return {
    invalidateClients: () => qc.invalidateQueries({ queryKey: ['clients'] }),
    invalidateClient: (id: string) => {
      qc.invalidateQueries({ queryKey: qk.client(id) })
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
    invalidateBookings: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
    invalidateClientBookings: (clientId: string) => {
      qc.invalidateQueries({ queryKey: qk.clientBookings(clientId) })
      qc.invalidateQueries({ queryKey: ['bookings'] })
    },
    invalidateSuppliers: () => qc.invalidateQueries({ queryKey: qk.suppliers() }),
    invalidateGroups: () => qc.invalidateQueries({ queryKey: qk.groups() }),
    invalidateAll: () => qc.invalidateQueries(),
  }
}

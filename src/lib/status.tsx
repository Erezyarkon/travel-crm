import React from 'react'

export interface StatusStyle { label: string; bg: string; color: string }

// ---- Booking statuses ----
export const BOOKING_STATUS: Record<string, StatusStyle> = {
  inquiry:      { label: 'Inquiry',      bg: '#F1F1F1', color: '#5F5E5A' },
  quoted:       { label: 'Quoted',       bg: '#FAEEDA', color: '#854F0B' },
  confirmed:    { label: 'Confirmed',    bg: '#E6F1FB', color: '#185FA5' },
  paid:         { label: 'Paid',         bg: '#EAF3DE', color: '#3B6D11' },
  voucher_sent: { label: 'Voucher Sent', bg: '#E1F5EE', color: '#0F6E56' },
  completed:    { label: 'Completed',    bg: '#E1F5EE', color: '#0F6E56' },
  cancelled:    { label: 'Cancelled',    bg: '#FBEAEA', color: '#A32D2D' },
}

export const BOOKING_STATUS_STEPS = ['inquiry', 'quoted', 'confirmed', 'paid', 'voucher_sent', 'completed']

// ---- Client statuses ----
export const CLIENT_STATUS: Record<string, StatusStyle> = {
  lead:   { label: 'Lead',   bg: '#E1F5EE', color: '#0F6E56' },
  active: { label: 'Active', bg: '#E6F1FB', color: '#185FA5' },
  past:   { label: 'Past',   bg: '#F1EFE8', color: '#5F5E5A' },
}

const FALLBACK: StatusStyle = { label: '—', bg: '#f0f0f0', color: '#888' }

export function bookingStatus(key: string): StatusStyle {
  return BOOKING_STATUS[key] || { ...FALLBACK, label: key || '—' }
}
export function clientStatus(key: string): StatusStyle {
  return CLIENT_STATUS[key] || { ...FALLBACK, label: key || '—' }
}

// Convenience label maps (for places that only need text)
export const BOOKING_STATUS_LABELS: Record<string, string> =
  Object.fromEntries(Object.entries(BOOKING_STATUS).map(([k, v]) => [k, v.label]))
export const CLIENT_STATUS_LABELS: Record<string, string> =
  Object.fromEntries(Object.entries(CLIENT_STATUS).map(([k, v]) => [k, v.label]))

// ---- Reusable badge component ----
export function StatusBadge({ status, kind = 'booking', size = 'md' }: { status: string; kind?: 'booking' | 'client'; size?: 'sm' | 'md' }) {
  const s = kind === 'client' ? clientStatus(status) : bookingStatus(status)
  const pad = size === 'sm' ? '2px 9px' : '3px 11px'
  const fs = size === 'sm' ? 10 : 11
  return (
    <span style={{ fontSize: fs, padding: pad, borderRadius: 20, background: s.bg, color: s.color, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>
      {s.label}
    </span>
  )
}

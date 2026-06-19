import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2, ChevronRight } from 'lucide-react'
import { supplierBookings } from '../lib/suppliers'
import { formatMoney } from '../lib/currency'

const STATUS_LABELS: Record<string, string> = {
  inquiry: 'Inquiry', quoted: 'Quoted', confirmed: 'Confirmed',
  paid: 'Paid', voucher_sent: 'Voucher Sent', completed: 'Completed', cancelled: 'Cancelled',
}

export default function SupplierBookings({ supplierId }: { supplierId: string }) {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supplierBookings(supplierId).then(d => { if (active) { setBookings(d); setLoading(false) } })
    return () => { active = false }
  }, [supplierId])

  // Total cost owed, grouped by currency (only non-cancelled)
  const totals: Record<string, number> = {}
  bookings.filter(b => b.status !== 'cancelled').forEach(b => {
    const cur = b.currency || 'USD'
    totals[cur] = (totals[cur] || 0) + (Number(b.cost_price) || 0)
  })
  const totalEntries = Object.entries(totals).filter(([, v]) => v > 0)

  if (loading) {
    return <div style={{ fontSize: 12, color: '#aaa', marginTop: 12 }}>Loading bookings…</div>
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.4px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Link2 size={11} /> Linked Bookings ({bookings.length})
        </div>
        {totalEntries.length > 0 && (
          <div style={{ fontSize: 11, color: '#854F0B', fontWeight: 600 }}>
            Total cost: {totalEntries.map(([cur, v]) => formatMoney(v, cur)).join(' · ')}
          </div>
        )}
      </div>

      {bookings.length === 0 ? (
        <div style={{ fontSize: 12, color: '#bbb', background: '#fff', border: '0.5px solid #eee', borderRadius: 8, padding: '10px 12px' }}>
          No bookings linked to this supplier yet. Link one from a booking's Financials panel.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {bookings.map(b => (
            <div key={b.id} onClick={() => b.client_id && navigate(`/clients/${b.client_id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#fff', border: '0.5px solid #eee', borderRadius: 8, cursor: 'pointer' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.service_name || 'Booking'}</div>
                <div style={{ fontSize: 10, color: '#888' }}>
                  {b.clients?.full_name || ''} · {STATUS_LABELS[b.status] || b.status}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {b.cost_price != null && <div style={{ fontSize: 12, fontWeight: 600, color: '#854F0B' }}>{formatMoney(b.cost_price, b.currency)}</div>}
                <div style={{ fontSize: 9, color: '#aaa' }}>cost</div>
              </div>
              <ChevronRight size={14} color="#ccc" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

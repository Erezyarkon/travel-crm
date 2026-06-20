import React, { useEffect, useState } from 'react'
import { CreditCard, Plus, Link2, Phone, Check, Trash2, ExternalLink } from 'lucide-react'
import {
  PaymentRequest, PAYMENT_FLOWS, PR_STATUS,
  listPaymentRequests, createPaymentRequest, markRequestPaid,
  updateRequestStatus, deletePaymentRequest,
} from '../lib/paymentRequests'
import { addPayment } from '../lib/payments'
import { formatMoney } from '../lib/currency'
import { useAuth } from '../lib/auth'

export default function PaymentRequestPanel({
  booking, currency, balance, onChange,
}: {
  booking: any
  currency: string
  balance: number
  onChange?: () => void
}) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  // new request form
  const [amount, setAmount] = useState(balance > 0 ? String(balance) : '')
  const [flow, setFlow] = useState('link')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    setRequests(await listPaymentRequests(booking.id))
    setLoading(false)
  }
  useEffect(() => { refresh() }, [booking.id])
  useEffect(() => { if (balance > 0 && !amount) setAmount(String(balance)) }, [balance])

  async function handleCreate() {
    const amt = Number(amount)
    if (!amt || amt <= 0) return
    setBusy(true)
    await createPaymentRequest({ bookingId: booking.id, amount: amt, currency, flow, note: note || null })
    setBusy(false)
    setNote(''); setAdding(false)
    refresh()
    onChange?.()
  }

  // Marking a request paid also records a real payment so the balance updates.
  async function handleMarkPaid(r: PaymentRequest) {
    if (!window.confirm(`Mark ${formatMoney(r.amount, r.currency)} as paid? This records a payment on the booking.`)) return
    await markRequestPaid(r.id)
    await addPayment(booking.id, r.amount, r.flow === 'manual' ? 'Credit Card' : 'Credit Card', new Date().toISOString().slice(0, 10), 'Via payment request')
    refresh()
    onChange?.()
  }

  async function handleCancel(r: PaymentRequest) {
    await updateRequestStatus(r.id, 'cancelled')
    refresh()
  }

  async function handleDelete(r: PaymentRequest) {
    if (!window.confirm('Delete this payment request?')) return
    await deletePaymentRequest(r.id)
    refresh()
    onChange?.()
  }

  if (!isAdmin) return null

  const inp: React.CSSProperties = { width: '100%', padding: '7px 9px', border: '0.5px solid #d0d0d0', borderRadius: 7, fontSize: 12, outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 10, color: '#888', fontWeight: 500 }

  return (
    <div style={{ borderTop: '0.5px solid #f0f0f0', padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: '#534AB7' }}>
          <CreditCard size={14} color="#534AB7" /> Card Payments {requests.length > 0 && <span style={{ color: '#999' }}>({requests.length})</span>}
        </span>
        <button onClick={() => { setAdding(a => !a); setNote('') }}
          style={{ fontSize: 10, color: '#534AB7', background: adding ? '#fff' : '#EEEDFE', border: '0.5px solid #B5AEE8', borderRadius: 20, padding: '3px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
          {adding ? 'Cancel' : <><Plus size={11} /> Request</>}
        </button>
      </div>

      {/* Provider-agnostic notice */}
      <div style={{ fontSize: 9, color: '#aaa', marginBottom: 8, lineHeight: 1.4 }}>
        Ready for a payment provider. Card details are never stored here — only the result of a transaction.
      </div>

      {adding && (
        <div style={{ background: '#fafafa', border: '0.5px solid #eee', borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 7 }}>
            <div><label style={lbl}>Amount ({currency})</label><input style={inp} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></div>
            <div>
              <label style={lbl}>Method</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={flow} onChange={e => setFlow(e.target.value)}>
                {PAYMENT_FLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={lbl}>Note (optional)</label>
            <input style={inp} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Deposit, final balance…" />
          </div>
          <button onClick={handleCreate} disabled={busy || !amount}
            style={{ width: '100%', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 7, padding: '8px', cursor: busy || !amount ? 'default' : 'pointer', fontWeight: 600, fontSize: 12, opacity: busy || !amount ? 0.6 : 1 }}>
            {busy ? 'Creating…' : 'Create Request'}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 8, textAlign: 'center', color: '#aaa', fontSize: 11 }}>Loading…</div>
      ) : requests.length === 0 ? (
        <div style={{ padding: 8, textAlign: 'center', color: '#bbb', fontSize: 11 }}>No card payment requests.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {requests.map(r => {
            const st = (PR_STATUS as any)[r.status] || PR_STATUS.pending
            const isPending = r.status === 'pending'
            return (
              <div key={r.id} style={{ background: '#fafafa', border: '0.5px solid #eee', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: '#EEEDFE', borderRadius: 6, padding: 5, flexShrink: 0 }}>
                    {r.flow === 'manual' ? <Phone size={12} color="#534AB7" /> : <Link2 size={12} color="#534AB7" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{formatMoney(r.amount, r.currency)}</div>
                    <div style={{ fontSize: 9, color: '#999' }}>
                      {r.flow === 'manual' ? 'Manual / phone' : 'Payment link'}
                      {r.card_last4 ? ` · ····${r.card_last4}` : ''}
                      {r.note ? ` · ${r.note}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
                  <button onClick={() => handleDelete(r)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#ccc' }}>
                    <Trash2 size={12} />
                  </button>
                </div>

                {r.pay_url && (
                  <a href={r.pay_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#534AB7', marginTop: 6, textDecoration: 'none' }}>
                    <ExternalLink size={11} /> Open payment link
                  </a>
                )}

                {isPending && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button onClick={() => handleMarkPaid(r)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', fontWeight: 600, fontSize: 11 }}>
                      <Check size={12} /> Mark Paid
                    </button>
                    <button onClick={() => handleCancel(r)}
                      style={{ background: '#fff', color: '#777', border: '0.5px solid #d0d0d0', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 11 }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

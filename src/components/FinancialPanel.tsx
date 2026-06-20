import React, { useEffect, useState } from 'react'
import { Wallet, Plus, Trash2, TrendingUp } from 'lucide-react'
import {
  Payment, PAYMENT_METHODS, listPayments, addPayment, deletePayment,
  updateBookingFinance, sumPayments,
} from '../lib/payments'
import { CURRENCIES, formatMoney } from '../lib/currency'
import { Supplier, listSuppliers } from '../lib/suppliers'
import PaymentRequestPanel from './PaymentRequestPanel'
import { useAuth } from '../lib/auth'

export default function FinancialPanel({
  booking, onChange,
}: {
  booking: any
  onChange?: () => void
}) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  // payment form
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Bank Transfer')
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  // finance edit
  const [currency, setCurrency] = useState(booking.currency || 'USD')
  const [cost, setCost] = useState(booking.cost_price != null ? String(booking.cost_price) : '')
  const [savingFin, setSavingFin] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState(booking.supplier_id || '')

  useEffect(() => {
    if (profile?.role === 'admin') listSuppliers().then(setSuppliers)
  }, [profile])

  async function refresh() {
    setPayments(await listPayments(booking.id))
    setLoading(false)
  }
  useEffect(() => { refresh() }, [booking.id])

  const price = Number(booking.total_price) || 0
  const paid = sumPayments(payments)
  const balance = price - paid
  const costNum = cost === '' ? null : Number(cost)
  const profit = costNum != null ? price - costNum : null

  async function handleAdd() {
    const amt = Number(amount)
    if (!amt || amt <= 0) return
    setBusy(true)
    await addPayment(booking.id, amt, method, paidOn || null, note || null)
    setBusy(false)
    setAmount(''); setNote(''); setAdding(false)
    refresh()
    onChange?.()
  }

  async function handleDelete(p: Payment) {
    if (!window.confirm(`Delete this ${formatMoney(p.amount, currency)} payment?`)) return
    await deletePayment(p.id)
    refresh()
    onChange?.()
  }

  async function saveFinance() {
    setSavingFin(true)
    await updateBookingFinance(booking.id, costNum, currency, supplierId || null)
    setSavingFin(false)
    onChange?.()
  }

  const lbl: React.CSSProperties = { fontSize: 10, color: '#888', fontWeight: 500 }
  const inp: React.CSSProperties = { width: '100%', padding: '7px 9px', border: '0.5px solid #d0d0d0', borderRadius: 7, fontSize: 12, outline: 'none', background: '#fafafa', boxSizing: 'border-box' }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Wallet size={15} color="#0F6E56" /> Financials
        </span>
        <select value={currency} onChange={e => setCurrency(e.target.value)} onBlur={saveFinance}
          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '0.5px solid #d0d0d0', background: '#fafafa', cursor: 'pointer', fontWeight: 600 }}>
          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#f0f0f0' }}>
        <Cell label="Price" value={formatMoney(price, currency)} color="#1a2a3a" />
        <Cell label="Paid" value={formatMoney(paid, currency)} color="#0F6E56" />
        <Cell label="Balance" value={formatMoney(balance, currency)} color={balance > 0 ? '#A32D2D' : '#0F6E56'} sub={balance <= 0 ? 'Fully paid ✓' : undefined} />
        {isAdmin
          ? <Cell label="Profit" value={profit != null ? formatMoney(profit, currency) : '—'} color={profit != null && profit >= 0 ? '#0F6E56' : '#A32D2D'} sub={costNum != null ? `cost ${formatMoney(costNum, currency)}` : 'set cost below'} />
          : <Cell label="Status" value={balance <= 0 ? 'Paid' : 'Open'} color={balance <= 0 ? '#0F6E56' : '#854F0B'} />}
      </div>

      {/* Supplier + cost (admin only) */}
      {isAdmin && (
        <div style={{ padding: '10px 16px', borderTop: '0.5px solid #f0f0f0' }}>
          <div style={{ marginBottom: 8 }}>
            <label style={lbl}>Supplier</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">— No supplier —</option>
              {[...suppliers].sort((a, b) => {
                // surface suppliers matching this booking's type first
                const am = a.type === booking.type ? 0 : 1
                const bm = b.type === booking.type ? 0 : 1
                return am - bm || a.name.localeCompare(b.name)
              }).map(s => (
                <option key={s.id} value={s.id}>{s.name}{s.type === booking.type ? '' : ` (${s.type})`}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Supplier cost ({currency})</label>
              <input style={inp} type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
            </div>
            <button onClick={saveFinance} disabled={savingFin}
              style={{ background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12, opacity: savingFin ? 0.7 : 1 }}>
              {savingFin ? '…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Payments list */}
      <div style={{ padding: '12px 16px', borderTop: '0.5px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#666' }}>Payments ({payments.length})</span>
          <button onClick={() => setAdding(a => !a)}
            style={{ fontSize: 10, color: '#0F6E56', background: adding ? '#fff' : '#E1F5EE', border: '0.5px solid #5DCAA5', borderRadius: 20, padding: '2px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
            {adding ? 'Cancel' : <><Plus size={11} /> Add</>}
          </button>
        </div>

        {adding && (
          <div style={{ background: '#fafafa', borderRadius: 8, border: '0.5px solid #eee', padding: 10, marginBottom: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 7 }}>
              <div><label style={lbl}>Amount</label><input style={inp} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus /></div>
              <div><label style={lbl}>Date</label><input style={inp} type="date" value={paidOn} onChange={e => setPaidOn(e.target.value)} /></div>
            </div>
            <div style={{ marginBottom: 7 }}>
              <label style={lbl}>Method</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={method} onChange={e => setMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>Note (optional)</label>
              <input style={inp} value={note} onChange={e => setNote(e.target.value)} placeholder="Reference, etc." />
            </div>
            <button onClick={handleAdd} disabled={busy || !amount}
              style={{ width: '100%', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 7, padding: '8px', cursor: busy || !amount ? 'default' : 'pointer', fontWeight: 600, fontSize: 12, opacity: busy || !amount ? 0.6 : 1 }}>
              {busy ? 'Saving…' : 'Record Payment'}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ padding: 10, textAlign: 'center', color: '#aaa', fontSize: 12 }}>Loading…</div>
        ) : payments.length === 0 ? (
          <div style={{ padding: 10, textAlign: 'center', color: '#bbb', fontSize: 12 }}>No payments recorded.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {payments.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: '#fafafa', borderRadius: 7, border: '0.5px solid #eee' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0F6E56' }}>{formatMoney(p.amount, currency)}</div>
                  <div style={{ fontSize: 9, color: '#999' }}>
                    {p.method}{p.paid_on ? ` · ${new Date(p.paid_on).toLocaleDateString('en-GB')}` : ''}{p.note ? ` · ${p.note}` : ''}
                  </div>
                </div>
                <button onClick={() => handleDelete(p)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, display: 'flex', color: '#ccc' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <PaymentRequestPanel booking={booking} currency={currency} balance={balance} onChange={() => { refresh(); onChange?.() }} />
    </div>
  )
}

function Cell({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ background: '#fff', padding: '10px 14px' }}>
      <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: '#aaa', marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

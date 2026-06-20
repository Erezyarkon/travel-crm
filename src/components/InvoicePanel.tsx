import React, { useEffect, useState } from 'react'
import { FileText, Plus, Trash2, Check, Printer } from 'lucide-react'
import {
  Invoice, InvoiceLine, listInvoices, createInvoice, deleteInvoice, computeTotals,
} from '../lib/invoices'
import { loadSettings } from '../lib/companySettings'
import { formatMoney } from '../lib/currency'
import { useAuth } from '../lib/auth'
import InvoiceModal from './InvoiceModal'

export default function InvoicePanel({ clientId, client, bookings }: { clientId: string; client: any; bookings: any[] }) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [viewing, setViewing] = useState<Invoice | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // builder state
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [currency, setCurrency] = useState('USD')
  const [vatOn, setVatOn] = useState(false)
  const [vatPercent, setVatPercent] = useState(18)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function refresh() {
    setInvoices(await listInvoices(clientId))
    setLoading(false)
  }
  useEffect(() => {
    refresh()
    loadSettings().then(s => {
      setVatOn(s.default_vat_on)
      setVatPercent(s.vat_percent || 18)
      setCurrency(s.default_currency || 'USD')
    })
  }, [clientId])

  const selectedBookings = bookings.filter(b => selected[b.id])
  const lines: InvoiceLine[] = selectedBookings.map(b => ({
    description: b.service_name || b.type,
    amount: Number(b.total_price) || 0,
  }))
  const { subtotal, vat_amount, total } = computeTotals(lines, vatPercent, vatOn)

  async function handleCreate() {
    if (lines.length === 0) { setMsg('Select at least one booking.'); return }
    setBusy(true); setMsg('')
    const { error } = await createInvoice({ clientId, currency, lines, vatOn })
    setBusy(false)
    if (error) { setMsg(error); return }
    setSelected({}); setCreating(false)
    refresh()
  }

  async function handleDelete(inv: Invoice) {
    if (!window.confirm(`Delete invoice ${inv.invoice_number}? This cannot be undone.`)) return
    await deleteInvoice(inv.id)
    refresh()
  }

  if (!isAdmin) return null  // invoicing is admin-only for now

  const lbl: React.CSSProperties = { fontSize: 10, color: '#888', fontWeight: 500 }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <FileText size={15} color="#854F0B" /> Invoices ({invoices.length})
        </span>
        <button onClick={() => { setCreating(c => !c); setMsg('') }}
          style={{ fontSize: 11, color: '#854F0B', background: creating ? '#fff' : '#FAEEDA', border: '0.5px solid #E0B877', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
          {creating ? 'Cancel' : <><Plus size={12} /> New Invoice</>}
        </button>
      </div>

      {creating && (
        <div style={{ padding: 16, borderBottom: '0.5px solid #f0f0f0', background: '#fafafa' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 8 }}>Select bookings to include:</div>
          {bookings.length === 0 ? (
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>No bookings on this client.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
              {bookings.map(b => (
                <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', background: '#fff', borderRadius: 7, border: '0.5px solid #eee', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!selected[b.id]} onChange={e => setSelected(s => ({ ...s, [b.id]: e.target.checked }))} />
                  <span style={{ flex: 1, fontSize: 12 }}>{b.service_name || b.type}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{formatMoney(b.total_price, b.currency)}</span>
                </label>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <div>
              <label style={lbl}>Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ display: 'block', padding: '6px 9px', border: '0.5px solid #d0d0d0', borderRadius: 7, fontSize: 12, background: '#fff', cursor: 'pointer' }}>
                {['USD', 'EUR', 'ILS'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#555', cursor: 'pointer', marginTop: 14 }}>
              <input type="checkbox" checked={vatOn} onChange={e => setVatOn(e.target.checked)} />
              Add VAT ({vatPercent}%)
            </label>
          </div>

          {/* Totals preview */}
          <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
            <Row label="Subtotal" value={formatMoney(subtotal, currency)} />
            {vatOn && <Row label={`VAT (${vatPercent}%)`} value={formatMoney(vat_amount, currency)} />}
            <Row label="Total" value={formatMoney(total, currency)} bold />
          </div>

          {msg && <div style={{ fontSize: 11, color: '#A32D2D', marginBottom: 10 }}>{msg}</div>}
          <button onClick={handleCreate} disabled={busy || lines.length === 0}
            style={{ width: '100%', background: '#854F0B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px', cursor: busy || lines.length === 0 ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, opacity: busy || lines.length === 0 ? 0.6 : 1 }}>
            {busy ? 'Creating…' : 'Generate Invoice'}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#aaa', fontSize: 12 }}>Loading…</div>
      ) : invoices.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#bbb', fontSize: 12 }}>No invoices yet.</div>
      ) : (
        <div style={{ padding: '8px 0' }}>
          {invoices.map(inv => (
            <div key={inv.id} style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '0.5px solid #f8f8f8' }}>
              <div style={{ background: '#FAEEDA', borderRadius: 7, padding: 6 }}><FileText size={14} color="#854F0B" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{inv.invoice_number}</div>
                <div style={{ fontSize: 10, color: '#999' }}>
                  {new Date(inv.issue_date).toLocaleDateString('en-GB')}
                  {inv.vat_amount > 0 ? ` · incl. VAT` : ` · 0% VAT`}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a3a' }}>{formatMoney(inv.total, inv.currency)}</div>
              <button onClick={() => setViewing(inv)} title="View / Print" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, display: 'flex', color: '#185FA5' }}>
                <Printer size={14} />
              </button>
              <button onClick={() => handleDelete(inv)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, display: 'flex', color: '#ccc' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {viewing && <InvoiceModal invoice={viewing} client={client} onClose={() => setViewing(null)} />}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: bold ? 13 : 12, fontWeight: bold ? 700 : 400, color: bold ? '#1a2a3a' : '#555', borderTop: bold ? '0.5px solid #eee' : 'none', marginTop: bold ? 4 : 0, paddingTop: bold ? 6 : 2 }}>
      <span>{label}</span><span>{value}</span>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { FileText, Plus, Trash2, Printer, X } from 'lucide-react'
import {
  Invoice, InvoiceLine, listInvoices, createInvoice, deleteInvoice, computeTotals,
} from '../lib/invoices'
import { loadSettings } from '../lib/companySettings'
import { formatMoney } from '../lib/currency'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import InvoiceModal from './InvoiceModal'
import EmptyState from './EmptyState'

interface DraftLine {
  id: string
  description: string
  qty: number
  unit_price: number
}

let lineCounter = 0
const newLineId = () => `line_${Date.now()}_${lineCounter++}`

export default function InvoicePanel({ clientId, client, bookings }: { clientId: string; client: any; bookings: any[] }) {
  const { profile } = useAuth()
  const toast = useToast()
  const isAdmin = profile?.role === 'admin'
  const [viewing, setViewing] = useState<Invoice | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // builder state
  const [draftLines, setDraftLines] = useState<DraftLine[]>([])
  const [currency, setCurrency] = useState('USD')
  const [vatOn, setVatOn] = useState(false)
  const [vatPercent, setVatPercent] = useState(18)
  const [notes, setNotes] = useState('')
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

  function openBuilder() {
    setCreating(true)
    setMsg('')
    setDraftLines([])
    setNotes('')
  }

  // Pull a booking in as a line: qty = number of travelers, unit price = total / qty
  function addBookingLine(b: any) {
    const qty = Number(b.num_travelers) > 0 ? Number(b.num_travelers) : 1
    const total = Number(b.total_price) || 0
    const unit = qty > 0 ? Math.round((total / qty) * 100) / 100 : total
    setDraftLines(ls => [...ls, {
      id: newLineId(),
      description: b.service_name || b.type || 'Service',
      qty,
      unit_price: unit,
    }])
  }

  function addBlankLine() {
    setDraftLines(ls => [...ls, { id: newLineId(), description: '', qty: 1, unit_price: 0 }])
  }

  function updateLine(id: string, field: keyof DraftLine, value: string) {
    setDraftLines(ls => ls.map(l => {
      if (l.id !== id) return l
      if (field === 'description') return { ...l, description: value }
      const num = value === '' ? 0 : Number(value)
      return { ...l, [field]: isNaN(num) ? 0 : num }
    }))
  }

  function removeLine(id: string) {
    setDraftLines(ls => ls.filter(l => l.id !== id))
  }

  const lines: InvoiceLine[] = draftLines.map(l => ({
    description: l.description.trim() || 'Item',
    qty: l.qty,
    unit_price: l.unit_price,
    amount: Math.round(l.qty * l.unit_price * 100) / 100,
  }))
  const { subtotal, vat_amount, total } = computeTotals(lines, vatPercent, vatOn)

  async function handleCreate() {
    if (lines.length === 0) { setMsg('Add at least one line.'); return }
    setBusy(true); setMsg('')
    const { error } = await createInvoice({ clientId, currency, lines, vatOn, notes: notes.trim() || undefined })
    setBusy(false)
    if (error) { setMsg(error); toast.error('Could not create invoice'); return }
    setDraftLines([]); setNotes(''); setCreating(false)
    refresh()
    toast.success('Invoice created')
  }

  async function handleDelete(inv: Invoice) {
    if (!window.confirm(`Delete invoice ${inv.invoice_number}? This cannot be undone.`)) return
    await deleteInvoice(inv.id)
    refresh()
    toast.info('Invoice deleted')
  }

  if (!isAdmin) return null  // invoicing is admin-only for now

  const lbl: React.CSSProperties = { fontSize: 10, color: '#888', fontWeight: 500 }
  const cellInp: React.CSSProperties = { padding: '5px 7px', border: '0.5px solid #d0d0d0', borderRadius: 6, fontSize: 12, outline: 'none', background: '#fff', boxSizing: 'border-box', width: '100%' }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <FileText size={15} color="#854F0B" /> Invoices ({invoices.length})
        </span>
        <button onClick={() => creating ? setCreating(false) : openBuilder()}
          style={{ fontSize: 11, color: '#854F0B', background: creating ? '#fff' : '#FAEEDA', border: '0.5px solid #E0B877', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
          {creating ? 'Cancel' : <><Plus size={12} /> New Invoice</>}
        </button>
      </div>

      {creating && (
        <div style={{ padding: 16, borderBottom: '0.5px solid #f0f0f0', background: '#fafafa' }}>
          {bookings.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 6 }}>Add from bookings:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {bookings.map(b => (
                  <button key={b.id} onClick={() => addBookingLine(b)}
                    style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, border: '0.5px solid #d0d0d0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Plus size={11} color="#854F0B" />
                    {b.service_name || b.type}
                    <span style={{ color: '#888' }}>{formatMoney(b.total_price, b.currency)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 6 }}>Line items:</div>
          {draftLines.length === 0 ? (
            <div style={{ fontSize: 12, color: '#aaa', padding: '10px 0', textAlign: 'center', border: '1px dashed #ddd', borderRadius: 8, marginBottom: 10 }}>
              Add a booking above, or add a blank line below.
            </div>
          ) : (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 84px 84px 26px', gap: 6, padding: '0 2px 4px', fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '.3px' }}>
                <span>Description</span><span style={{ textAlign: 'center' }}>Qty</span><span style={{ textAlign: 'right' }}>Unit</span><span style={{ textAlign: 'right' }}>Total</span><span />
              </div>
              {draftLines.map(l => (
                <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr 52px 84px 84px 26px', gap: 6, alignItems: 'center', marginBottom: 5 }}>
                  <input style={cellInp} value={l.description} placeholder="Description" onChange={e => updateLine(l.id, 'description', e.target.value)} />
                  <input style={{ ...cellInp, textAlign: 'center' }} type="number" value={l.qty} onChange={e => updateLine(l.id, 'qty', e.target.value)} />
                  <input style={{ ...cellInp, textAlign: 'right' }} type="number" value={l.unit_price} onChange={e => updateLine(l.id, 'unit_price', e.target.value)} />
                  <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#1a2a3a' }}>{formatMoney(l.qty * l.unit_price, currency)}</div>
                  <button onClick={() => removeLine(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', display: 'flex', padding: 2 }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}

          <button onClick={addBlankLine}
            style={{ fontSize: 11, color: '#185FA5', background: '#fff', border: '0.5px dashed #9bbde0', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14 }}>
            <Plus size={12} /> Add blank line
          </button>

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

          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Notes (optional)</label>
            <input style={{ ...cellInp, marginTop: 3 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, reference, etc." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 8, padding: '10px 12px', width: 280 }}>
              <Row label="Subtotal" value={formatMoney(subtotal, currency)} />
              {vatOn && <Row label={`VAT (${vatPercent}%)`} value={formatMoney(vat_amount, currency)} />}
              <Row label="Total" value={formatMoney(total, currency)} bold />
            </div>
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
        <EmptyState icon={FileText} title="No invoices yet" hint="Create an invoice from this client's bookings." compact />
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

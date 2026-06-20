import React, { useEffect, useState } from 'react'
import { LOGO_SRC } from '../lib/logo'
import { Invoice } from '../lib/invoices'
import { getCachedSettings, loadSettings, CompanySettings } from '../lib/companySettings'
import { formatMoney } from '../lib/currency'

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  ltd: 'Company Ltd.',
  licensed: 'Licensed Dealer',
  exempt: 'Exempt Dealer',
}

export default function InvoiceModal({ invoice, client, onClose }: { invoice: Invoice; client: any; onClose: () => void }) {
  const [company, setCompany] = useState<CompanySettings>(getCachedSettings())
  useEffect(() => { loadSettings().then(setCompany) }, [])

  const cur = invoice.currency
  const hasVat = invoice.vat_amount > 0

  const s = {
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, overflow: 'auto', padding: 20 },
    page: { background: '#fff', width: '100%', maxWidth: 794, margin: '0 auto', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif', fontSize: 11, color: '#1a1a1a', boxShadow: '0 4px 24px rgba(0,0,0,.2)' },
    hdr: { background: '#1a2a3a', padding: '14px 22px', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    body: { padding: '18px 22px' },
    lbl: { fontSize: 8, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '.4px', fontWeight: 500 as const, display: 'block' as const, marginBottom: 1 },
    val: { fontSize: 11, color: '#1a2a3a', fontWeight: 500 as const },
    th: { background: '#1a2a3a', color: '#fff', fontSize: 9, fontWeight: 600 as const, textTransform: 'uppercase' as const, padding: '7px 10px', textAlign: 'left' as const },
    thR: { background: '#1a2a3a', color: '#fff', fontSize: 9, fontWeight: 600 as const, textTransform: 'uppercase' as const, padding: '7px 10px', textAlign: 'right' as const },
    td: { padding: '8px 10px', borderBottom: '0.5px solid #eee', fontSize: 11 },
    tdR: { padding: '8px 10px', borderBottom: '0.5px solid #eee', fontSize: 11, textAlign: 'right' as const, fontWeight: 600 as const },
    footer: { background: '#1a2a3a', padding: '8px 22px', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  }

  return (
    <div style={s.overlay} id="invoice-print-root">
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'flex-end' }} className="no-print">
          <button onClick={() => window.print()} style={{ padding: '8px 18px', background: '#f5c842', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🖨 Print / Save PDF</button>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#fff', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>✕ Close</button>
        </div>

        <div style={s.page}>
          {/* Header */}
          <div style={s.hdr}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={LOGO_SRC} style={{ height: 46, width: 'auto', objectFit: 'contain' }} alt="logo" />
              <div style={{ color: '#7899bb', fontSize: 10 }}>{company.website} · {company.phone} · {company.email}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#f5c842', fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Invoice</div>
              <div style={{ color: '#fff', fontSize: 12, marginTop: 2 }}>{invoice.invoice_number}</div>
              <div style={{ color: '#7899bb', fontSize: 9, marginTop: 1 }}>{new Date(invoice.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          <div style={s.body}>
            {/* From / To */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 20 }}>
              <div>
                <span style={s.lbl}>From</span>
                <div style={{ ...s.val, fontWeight: 700, marginBottom: 2 }}>{company.legal_name || company.company_name}</div>
                {company.business_number && <div style={{ fontSize: 10, color: '#555' }}>{BUSINESS_TYPE_LABELS[company.business_type] || ''} · {company.business_number}</div>}
                {company.address && <div style={{ fontSize: 10, color: '#555' }}>{company.address}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={s.lbl}>Bill To</span>
                <div style={{ ...s.val, fontWeight: 700, marginBottom: 2 }}>{client.full_name}</div>
                {client.phone && <div style={{ fontSize: 10, color: '#555' }}>{client.phone}</div>}
                {client.email && <div style={{ fontSize: 10, color: '#555' }}>{client.email}</div>}
                <div style={{ fontSize: 10, color: '#555' }}>File: {client.file_number}</div>
              </div>
            </div>

            {/* Line items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr>
                  <th style={s.th}>Description</th>
                  <th style={{ ...s.thR, width: 50 }}>Qty</th>
                  <th style={{ ...s.thR, width: 90 }}>Unit Price</th>
                  <th style={{ ...s.thR, width: 90 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((l, i) => {
                  const qty = (l as any).qty
                  const unit = (l as any).unit_price
                  const hasDetail = qty != null && unit != null
                  return (
                    <tr key={i}>
                      <td style={s.td}>{l.description}</td>
                      <td style={{ ...s.tdR, fontWeight: 400 }}>{hasDetail ? qty : ''}</td>
                      <td style={{ ...s.tdR, fontWeight: 400 }}>{hasDetail ? formatMoney(unit, cur) : ''}</td>
                      <td style={s.tdR}>{formatMoney(l.amount, cur)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: 260 }}>
                <Row label="Subtotal" value={formatMoney(invoice.subtotal, cur)} />
                {hasVat
                  ? <Row label={`VAT (${invoice.vat_percent}%)`} value={formatMoney(invoice.vat_amount, cur)} />
                  : <Row label="VAT" value="0% (tourism)" muted />}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0 0', marginTop: 6, borderTop: '2px solid #1a2a3a' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2a3a' }}>Total</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1a2a3a' }}>{formatMoney(invoice.total, cur)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div style={{ marginTop: 20, padding: '10px 12px', background: '#fafafa', border: '0.5px solid #eee', borderRadius: 6 }}>
                <span style={s.lbl}>Notes</span>
                <div style={{ fontSize: 11, color: '#333' }}>{invoice.notes}</div>
              </div>
            )}

            <div style={{ marginTop: 24, fontSize: 9, color: '#999', textAlign: 'center', borderTop: '0.5px solid #eee', paddingTop: 10 }}>
              This document is a commercial invoice issued by {company.legal_name || company.company_name}. Thank you for your business.
            </div>
          </div>

          {/* Footer */}
          <div style={s.footer}>
            <div style={{ fontSize: 9, color: '#f5c842', fontWeight: 500 }}>{invoice.invoice_number}</div>
            <div style={{ fontSize: 9, color: '#7899bb' }}>{company.company_name} · {company.website}</div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print-root, #invoice-print-root * { visibility: visible !important; }
          #invoice-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #fff !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .no-print { display: none !important; }
          @page { margin: 12mm; }
        }
      `}</style>
    </div>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11, color: muted ? '#999' : '#555' }}>
      <span>{label}</span><span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}

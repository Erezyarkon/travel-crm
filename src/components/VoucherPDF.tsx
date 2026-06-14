import React from 'react'
import { LOGO_SRC } from '../lib/logo'
import { formatDate, generateVoucherNumber, BOOKING_COLORS } from '../lib/voucher'

interface Props {
  booking: any
  client: any
  travelers: any[]
  onClose: () => void
}

const STATUS_STEPS = ['inquiry','quoted','confirmed','paid','voucher_sent','completed']
const STATUS_LABELS: Record<string,string> = {
  inquiry:'Inquiry', quoted:'Quoted', confirmed:'Confirmed',
  paid:'Paid', voucher_sent:'Voucher Sent', completed:'Completed'
}

export default function VoucherPDF({ booking, client, travelers, onClose }: Props) {
  const vchNum = generateVoucherNumber()
  const bc = BOOKING_COLORS[booking.type] || { color: '#1a2a3a', bg: '#f0f4f8', label: booking.type }
  const stepIdx = STATUS_STEPS.indexOf(booking.status)
  const isVoucher = ['paid','voucher_sent','completed'].includes(booking.status)
  const allTravelers = [
    { full_name: client.full_name, type: 'adult', passport_number: client.passport_number, date_of_birth: client.date_of_birth, nationality: client.nationality, is_lead: true },
    ...travelers
  ]

  const s: Record<string, React.CSSProperties> = {
    page: { background: '#fff', width: '100%', maxWidth: 794, margin: '0 auto', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif', fontSize: 11, color: '#1a1a1a', boxShadow: '0 2px 16px rgba(0,0,0,.15)' },
    hdr: { background: '#1a2a3a', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    logo: { height: 48, width: 'auto', objectFit: 'contain' as const },
    docType: { color: '#f5c842', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px' },
    docNum: { color: '#aabbcc', fontSize: 10, marginTop: 2 },
    docDate: { color: '#7899bb', fontSize: 9, marginTop: 1 },
    clientStrip: { background: '#f0f4f8', borderBottom: '0.5px solid #dde3ea', padding: '7px 20px', display: 'flex', alignItems: 'center', gap: 20 },
    csLabel: { fontSize: 8, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '.4px', fontWeight: 500, display: 'block', marginBottom: 1 },
    csValue: { fontSize: 11, color: '#1a2a3a', fontWeight: 500 },
    fileBadge: { background: '#1a2a3a', color: '#f5c842', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 12, marginLeft: 'auto' },
    statusBar: { background: '#1a2a3a', padding: '6px 20px', display: 'flex', alignItems: 'center' },
    body: { padding: '14px 20px' },
    secHead: { fontSize: 9, fontWeight: 700, color: '#1a2a3a', textTransform: 'uppercase' as const, letterSpacing: '.5px', borderBottom: '1.5px solid #1a2a3a', paddingBottom: 3, marginBottom: 7, marginTop: 12 },
    fieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 },
    fieldLabel: { fontSize: 8, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '.3px', display: 'block', marginBottom: 1 },
    fieldVal: { fontSize: 11, color: '#1a1a1a', fontWeight: 500, paddingBottom: 2, borderBottom: '0.5px solid #e8e8e8' },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 10, marginBottom: 10 },
    th: { background: '#f0f4f8', fontSize: 8, color: '#555', fontWeight: 600, textTransform: 'uppercase' as const, padding: '4px 6px', textAlign: 'left' as const, border: '0.5px solid #dde3ea' },
    td: { padding: '4px 6px', border: '0.5px solid #eee', color: '#1a1a1a' },
    priceStrip: { background: '#f0f4f8', border: '0.5px solid #dde3ea', borderRadius: 6, padding: '8px 12px', display: 'flex', marginBottom: 10 },
    priceItem: { flex: 1, textAlign: 'center' as const, borderRight: '0.5px solid #dde3ea' },
    vchBox: { background: '#E6F1FB', border: '1.5px solid #85B7EB', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    notesBox: { background: '#fffbf0', border: '0.5px solid #f5c842', borderRadius: 6, padding: '7px 10px', fontSize: 10, color: '#412402', marginBottom: 10 },
    confirmNote: { background: '#E1F5EE', border: '0.5px solid #5DCAA5', borderRadius: 6, padding: '7px 12px', fontSize: 9, color: '#085041', textAlign: 'center' as const, marginBottom: 10 },
    footer: { background: '#1a2a3a', padding: '7px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    footerTxt: { fontSize: 9, color: '#7899bb' },
    footerCenter: { fontSize: 9, color: '#f5c842', fontWeight: 500, textAlign: 'center' as const },
  }

  const details = booking.details || {}
  const balance = (booking.total_price - booking.deposit_paid).toFixed(2)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1000, overflow: 'auto', padding: 20 }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'flex-end' }}>
          <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#f5c842', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🖨 Print / Save PDF</button>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#fff', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>✕ Close</button>
        </div>

        <div style={s.page} id="voucher-print">
          {/* Header */}
          <div style={s.hdr}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={LOGO_SRC} style={s.logo} alt="EYT Erezyarkon Travel" />
              <div style={{ color: '#7899bb', fontSize: 10 }}>erezyarkon.com · +972-50-000-0000 · erez@erezyarkon.com</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={s.docType}>{isVoucher ? `${bc.label} Voucher` : `${bc.label} Booking`}</div>
              <div style={s.docNum}>File: {client.file_number}</div>
              <div style={s.docDate}>{isVoucher ? 'Issued' : 'Date'}: {new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })}</div>
            </div>
          </div>

          {/* Client strip */}
          <div style={s.clientStrip}>
            <div><span style={s.csLabel}>Client</span><span style={s.csValue}>{client.full_name}</span></div>
            <div><span style={s.csLabel}>Phone</span><span style={s.csValue}>{client.phone}</span></div>
            <div><span style={s.csLabel}>Email</span><span style={s.csValue}>{client.email}</span></div>
            <div><span style={s.csLabel}>Nationality</span><span style={s.csValue}>{client.nationality}</span></div>
            <div style={s.fileBadge}>{client.file_number}</div>
          </div>

          {/* Status bar */}
          <div style={s.statusBar}>
            {STATUS_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 600, border: `1.5px solid ${i <= stepIdx ? '#1D9E75' : '#3a5270'}`, background: i < stepIdx ? '#1D9E75' : i === stepIdx ? '#E1F5EE' : '#1a2a3a', color: i < stepIdx ? '#fff' : i === stepIdx ? '#0F6E56' : '#7899bb' }}>
                    {i < stepIdx ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 7, color: i <= stepIdx ? '#9FE1CB' : '#7899bb', marginTop: 2, whiteSpace: 'nowrap' }}>{STATUS_LABELS[step]}</div>
                </div>
                {i < STATUS_STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < stepIdx ? '#1D9E75' : '#3a5270', marginBottom: 10 }} />}
              </React.Fragment>
            ))}
          </div>

          <div style={s.body}>
            {/* Voucher number box — only when paid/sent */}
            {isVoucher && (
              <div style={s.vchBox}>
                <div>
                  <div style={{ fontSize: 10, color: '#185FA5', fontWeight: 600 }}>✈ {bc.label} Voucher — Present to supplier</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#042C53', letterSpacing: 2, fontFamily: 'monospace', margin: '4px 0' }}>{vchNum}</div>
                  <div style={{ fontSize: 9, color: '#378ADD' }}>Issued {new Date().toLocaleDateString('en-GB')} · Valid for service dates only</div>
                </div>
                <div style={{ width: 56, height: 56, background: '#fff', border: '0.5px solid #85B7EB', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#85B7EB', textAlign: 'center' }}>QR<br />Code</div>
              </div>
            )}

            {/* Booking details */}
            <div style={s.secHead}>{bc.label} Details</div>
            <div style={s.fieldGrid}>
              <div><span style={s.fieldLabel}>Service</span><div style={s.fieldVal}>{booking.service_name}</div></div>
              {(booking.check_in || booking.pickup_date) && <div><span style={s.fieldLabel}>{booking.type === 'hotel' ? 'Check-in' : 'Date'}</span><div style={s.fieldVal}>{formatDate(booking.check_in || booking.pickup_date)}</div></div>}
              {(booking.check_out || booking.return_date) && <div><span style={s.fieldLabel}>{booking.type === 'hotel' ? 'Check-out' : 'Return'}</span><div style={s.fieldVal}>{formatDate(booking.check_out || booking.return_date)}</div></div>}
              {details.city && <div><span style={s.fieldLabel}>City</span><div style={s.fieldVal}>{details.city}</div></div>}
              {details.room_type && <div><span style={s.fieldLabel}>Room type</span><div style={s.fieldVal}>{details.room_type}</div></div>}
              {details.meal_plan && <div><span style={s.fieldLabel}>Meal plan</span><div style={s.fieldVal}>{details.meal_plan}</div></div>}
              {details.car_type && <div><span style={s.fieldLabel}>Vehicle</span><div style={s.fieldVal}>{details.car_type}</div></div>}
              {details.from && <div><span style={s.fieldLabel}>From</span><div style={s.fieldVal}>{details.from}</div></div>}
              {details.to && <div><span style={s.fieldLabel}>To</span><div style={s.fieldVal}>{details.to}</div></div>}
              {details.flight_no && <div><span style={s.fieldLabel}>Flight</span><div style={s.fieldVal}>{details.airline} {details.flight_no}</div></div>}
              {details.cabin_class && <div><span style={s.fieldLabel}>Class</span><div style={s.fieldVal}>{details.cabin_class}</div></div>}
              <div><span style={s.fieldLabel}>Travelers</span><div style={s.fieldVal}>{booking.num_travelers}</div></div>
              {booking.supplier_confirmation && <div><span style={s.fieldLabel}>Supplier ref.</span><div style={{ ...s.fieldVal, color: '#185FA5', fontWeight: 700 }}>{booking.supplier_confirmation}</div></div>}
            </div>

            {/* Travelers table */}
            {allTravelers.length > 0 && (
              <>
                <div style={s.secHead}>
                  {booking.type === 'hotel' ? 'Registered Guests' : booking.type === 'flight' ? 'Passengers' : 'Travelers'}
                </div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>#</th>
                      <th style={s.th}>Full name</th>
                      <th style={s.th}>Type</th>
                      {['flight','visa'].includes(booking.type) && <th style={s.th}>Passport no.</th>}
                      {['flight','visa','hotel'].includes(booking.type) && <th style={s.th}>Date of birth</th>}
                      <th style={s.th}>Nationality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTravelers.map((tr, i) => (
                      <tr key={i} style={{ background: i % 2 === 1 ? '#fafafa' : '#fff' }}>
                        <td style={s.td}>{i + 1}</td>
                        <td style={{ ...s.td, fontWeight: 600 }}>{tr.full_name}</td>
                        <td style={s.td}>
                          <span style={{ fontSize: 8, fontWeight: 500, padding: '1px 5px', borderRadius: 8, background: tr.type === 'child' ? '#B5D4F4' : '#E6F1FB', color: tr.type === 'child' ? '#042C53' : '#0C447C' }}>
                            {tr.type === 'child' ? `Child · ${tr.age}` : tr.is_lead ? 'Adult · Lead' : 'Adult'}
                          </span>
                        </td>
                        {['flight','visa'].includes(booking.type) && <td style={{ ...s.td, fontFamily: 'monospace' }}>{tr.passport_number || '—'}</td>}
                        {['flight','visa','hotel'].includes(booking.type) && <td style={s.td}>{tr.date_of_birth || '—'}</td>}
                        <td style={s.td}>{tr.nationality || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Pricing */}
            <div style={s.priceStrip}>
              <div style={s.priceItem}>
                <span style={{ fontSize: 8, color: '#888', textTransform: 'uppercase' as const, display: 'block', marginBottom: 2 }}>Total price</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1a2a3a' }}>${booking.total_price}</span>
              </div>
              <div style={{ ...s.priceItem, borderRight: '0.5px solid #dde3ea' }}>
                <span style={{ fontSize: 8, color: '#888', textTransform: 'uppercase' as const, display: 'block', marginBottom: 2 }}>Deposit paid</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0F6E56' }}>${booking.deposit_paid}</span>
              </div>
              <div style={{ ...s.priceItem, borderRight: '0.5px solid #dde3ea' }}>
                <span style={{ fontSize: 8, color: '#888', textTransform: 'uppercase' as const, display: 'block', marginBottom: 2 }}>Balance due</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: parseFloat(balance) > 0 ? '#854F0B' : '#0F6E56' }}>${balance}</span>
              </div>
              <div style={{ ...s.priceItem, borderRight: 'none' }}>
                <span style={{ fontSize: 8, color: '#888', textTransform: 'uppercase' as const, display: 'block', marginBottom: 2 }}>Status</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: isVoucher ? '#0F6E56' : '#854F0B' }}>{isVoucher ? 'PAID ✓' : STATUS_LABELS[booking.status]}</span>
              </div>
            </div>

            {/* Notes */}
            {booking.notes && (
              <div style={s.notesBox}>
                <strong style={{ display: 'block', marginBottom: 3, fontSize: 8, textTransform: 'uppercase' as const, letterSpacing: '.3px', color: '#1a2a3a' }}>Special requests</strong>
                {booking.notes}
              </div>
            )}

            {/* Confirmation note for vouchers */}
            {isVoucher && (
              <div style={s.confirmNote}>
                <strong>Please present this voucher to the service provider.</strong><br />
                For assistance: EYT Erezyarkon Travel · +972-50-000-0000 · erez@erezyarkon.com · erezyarkon.com
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={s.footer}>
            <div style={s.footerTxt}>EYT Erezyarkon Travel · erezyarkon.com</div>
            <div style={s.footerCenter}>{isVoucher ? vchNum : `${client.file_number} · ${bc.label}`}</div>
            <div style={s.footerTxt}>Page 1 of 1 · {new Date().toLocaleDateString('en-GB')}</div>
          </div>
        </div>
      </div>

      <style>{`@media print { body > *:not(#voucher-print) { display: none !important; } }`}</style>
    </div>
  )
}

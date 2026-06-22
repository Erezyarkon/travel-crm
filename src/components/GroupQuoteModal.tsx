import React, { useEffect, useState } from 'react'
import { LOGO_SRC } from '../lib/logo'
import { getCachedSettings, loadSettings, CompanySettings } from '../lib/companySettings'
import { formatMoney } from '../lib/currency'
import { computePricing, singleRoomPrice, PricingModel } from '../lib/groupPricing'

const DEFAULT_INCLUDES = [
  'Meet & assist on arrival at Ben Gurion Airport by EYT representative',
  'Luxury air-conditioned coach throughout (driver included)',
  'Hotel accommodation as per programme, on the stated board basis',
  'Porterage at all hotels',
  'Entrance fees as per agreed itinerary',
  'Professional licensed English-speaking guide throughout',
  'All local taxes and service charges at hotels',
]
const DEFAULT_EXCLUDES = [
  'International airfares, airport taxes, border taxes and visa fees',
  'Expenses of a personal nature',
  'Lunches and beverages not specified in the itinerary',
  'Tips for guide and driver (recommended: guide US$5 / driver US$4 per person per day)',
  'Tips for hotel and restaurant staff',
  'Travel insurance (strongly recommended)',
]

// Build a hotel programme by collapsing consecutive days at the same hotel.
function buildHotelProgramme(model: PricingModel) {
  const days = model?.days || []
  const rows: { from: string; to: string; hotel: string; board: string; nights: number }[] = []
  let cur: any = null
  for (const d of days) {
    if (!d.hotel) continue
    if (cur && cur.hotel === d.hotel && cur.board === d.board) {
      cur.to = d.date; cur.nights += 1
    } else {
      if (cur) rows.push(cur)
      cur = { from: d.date, to: d.date, hotel: d.hotel, board: d.board, nights: 1 }
    }
  }
  if (cur) rows.push(cur)
  return rows
}

function fmtDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function GroupQuoteModal({ group, onClose }: { group: any; onClose: () => void }) {
  const [company, setCompany] = useState<CompanySettings>(getCachedSettings())
  useEffect(() => { loadSettings().then(setCompany) }, [])

  const cur = group.currency || 'USD'
  const model: PricingModel | null = group.pricing && group.pricing.days ? group.pricing : null
  const totals = model ? computePricing(model) : null
  const programme = model ? buildHotelProgramme(model) : []

  const s = {
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, overflow: 'auto', padding: 20, direction: 'ltr' as const, textAlign: 'left' as const },
    page: { background: '#fff', width: '100%', maxWidth: 794, margin: '0 auto', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif', fontSize: 11.5, color: '#1a1a1a', boxShadow: '0 4px 24px rgba(0,0,0,.2)' },
    hdr: { background: '#1a2a3a', padding: '16px 24px', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    body: { padding: '20px 24px' },
    secTitle: { fontSize: 12, fontWeight: 700 as const, color: '#1a2a3a', textTransform: 'uppercase' as const, letterSpacing: '.5px', margin: '18px 0 8px', borderBottom: '2px solid #f5c842', paddingBottom: 4 },
    th: { background: '#1a2a3a', color: '#fff', fontSize: 10, fontWeight: 600 as const, textTransform: 'uppercase' as const, padding: '8px 10px', textAlign: 'left' as const },
    thR: { background: '#1a2a3a', color: '#fff', fontSize: 10, fontWeight: 600 as const, textTransform: 'uppercase' as const, padding: '8px 10px', textAlign: 'right' as const },
    td: { padding: '8px 10px', borderBottom: '0.5px solid #eee', fontSize: 11.5 },
    tdR: { padding: '8px 10px', borderBottom: '0.5px solid #eee', fontSize: 11.5, textAlign: 'right' as const, fontWeight: 600 as const },
    ovLabel: { padding: '7px 10px', borderBottom: '0.5px solid #eee', fontSize: 11, fontWeight: 700 as const, background: '#fafafa', width: 150 },
    ovVal: { padding: '7px 10px', borderBottom: '0.5px solid #eee', fontSize: 11.5 },
  }

  return (
    <div style={s.overlay} id="quote-print-root">
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'flex-end' }} className="no-print">
          <button onClick={() => window.print()} style={{ padding: '8px 18px', background: '#f5c842', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🖨 Print / Save PDF</button>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#fff', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>✕ Close</button>
        </div>

        <div style={s.page}>
          {/* Header */}
          <div style={s.hdr}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={LOGO_SRC} style={{ height: 48, width: 'auto', objectFit: 'contain' }} alt="logo" />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#f5c842', fontSize: 17, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Group Quotation</div>
              <div style={{ color: '#7899bb', fontSize: 10, marginTop: 2 }}>{company.website} · {company.phone}</div>
            </div>
          </div>

          <div style={s.body}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a2a3a' }}>{group.name}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              All rates are quoted in {cur} per person and are based on the itinerary and hotels below.
            </div>

            {/* Tour overview */}
            <div style={s.secTitle}>Tour Overview</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {group.start_date && <tr><td style={s.ovLabel}>Tour Period</td><td style={s.ovVal}>{fmtDate(group.start_date)} – {fmtDate(group.end_date)}{group.nights ? ` (${group.nights + 1} Days / ${group.nights} Nights)` : ''}</td></tr>}
                {group.destination && <tr><td style={s.ovLabel}>Destination</td><td style={s.ovVal}>{group.destination}</td></tr>}
                {group.meal_plan && <tr><td style={s.ovLabel}>Meal Plan</td><td style={s.ovVal}>{group.meal_plan === 'HB' ? 'Half Board (HB) – Breakfast & Dinner daily' : group.meal_plan}</td></tr>}
                <tr><td style={s.ovLabel}>Transport</td><td style={s.ovVal}>Luxury air-conditioned coach (size matched to group)</td></tr>
                <tr><td style={s.ovLabel}>Guide</td><td style={s.ovVal}>Licensed professional English-speaking guide throughout</td></tr>
                <tr><td style={s.ovLabel}>Quote Date</td><td style={s.ovVal}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</td></tr>
              </tbody>
            </table>

            {/* Rates */}
            <div style={s.secTitle}>Rates – Per Person ({cur})</div>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Rates are per person sharing a double room, based on group size and vehicle category.</div>
            {totals && totals.tierResults.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={s.th}>Group Size</th>
                    <th style={s.thR}>Price Per Person (Sharing Double)</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.tierResults.map((t, i) => (
                    <tr key={i}>
                      <td style={s.td}>{t.pax} Passengers</td>
                      <td style={s.tdR}>{formatMoney(Math.round(t.totalPrice), cur)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...s.td, fontWeight: 700, background: '#fafafa' }}>Single Room Supplement</td>
                    <td style={{ ...s.tdR, fontWeight: 700, background: '#fafafa' }}>
                      {group.single_supplement ? formatMoney(group.single_supplement, cur) : (totals.tierResults.length ? formatMoney(Math.round(singleRoomPrice(model!, totals.tierResults[totals.tierResults.length - 1]) - totals.tierResults[totals.tierResults.length - 1].totalPrice), cur) : '—')}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div style={{ fontSize: 11.5, color: '#999', padding: '8px 0' }}>
                {group.price_per_person ? `From ${formatMoney(group.price_per_person, cur)} per person.` : 'Pricing not yet calculated. Use the Pricing Calculator first.'}
              </div>
            )}

            {/* Hotel programme */}
            {programme.length > 0 && (
              <>
                <div style={s.secTitle}>Hotel Programme</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={s.th}>Dates</th>
                      <th style={s.th}>Hotel</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>Nights</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>Board</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programme.map((r, i) => (
                      <tr key={i}>
                        <td style={s.td}>{fmtDate(r.from)} – {fmtDate(r.to)}</td>
                        <td style={{ ...s.td, fontWeight: 600 }}>{r.hotel}</td>
                        <td style={{ ...s.td, textAlign: 'center' }}>{r.nights}</td>
                        <td style={{ ...s.td, textAlign: 'center' }}>{r.board}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Includes / Excludes */}
            <div style={s.secTitle}>Rates Include</div>
            <ul style={{ margin: '0 0 6px', paddingLeft: 18, fontSize: 11.5, lineHeight: 1.7 }}>
              {DEFAULT_INCLUDES.map((x, i) => <li key={i}>{x}</li>)}
            </ul>

            <div style={s.secTitle}>Rates Do Not Include</div>
            <ul style={{ margin: '0 0 6px', paddingLeft: 18, fontSize: 11.5, lineHeight: 1.7 }}>
              {DEFAULT_EXCLUDES.map((x, i) => <li key={i}>{x}</li>)}
            </ul>

            {/* Sign off */}
            <div style={{ marginTop: 20, fontSize: 11.5, lineHeight: 1.6 }}>
              We look forward to welcoming your group to the Holy Land and ensuring an unforgettable experience.
              <div style={{ marginTop: 14, fontWeight: 700 }}>{company.legal_name || company.company_name}</div>
              {company.phone && <div style={{ color: '#666' }}>Tel: {company.phone}</div>}
              {company.email && <div style={{ color: '#666' }}>{company.email}</div>}
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: '#1a2a3a', padding: '8px 24px', textAlign: 'center', color: '#7899bb', fontSize: 9 }}>
            {company.company_name} · {company.website} · This quotation is subject to availability at time of confirmation.
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #quote-print-root, #quote-print-root * { visibility: visible !important; }
          #quote-print-root {
            position: absolute !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important; background: #fff !important;
            padding: 0 !important; overflow: visible !important;
            direction: ltr !important; text-align: left !important;
          }
          .no-print { display: none !important; }
          @page { margin: 12mm; }
        }
      `}</style>
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import { Plus, Trash2, Calculator, Save, Copy } from 'lucide-react'
import {
  PricingModel, PricingDay, DEFAULT_PRICING, computePricing, singleRoomPrice,
} from '../lib/groupPricing'
import { updateGroup } from '../lib/groups'
import { formatMoney } from '../lib/currency'
import { useToast } from '../lib/toast'

// Column widths — shared between header and rows so they never drift
const COL = {
  date:    128,
  hotel:   138,
  board:   48,
  dbl:     66,
  sgl:     66,
  meals:   64,
  entr:    64,
  guide:   62,
  shab:    72,
  misc:    56,
  staff:   86,
  actions: 44,
}

export default function GroupPricingPanel({ group, onSaved }: { group: any; onSaved?: (price: number, single: number) => void }) {
  const toast = useToast()
  const cur = group.currency || 'USD'
  const [m, setM] = useState<PricingModel>(() => normalize(group.pricing))
  const [busy, setBusy] = useState(false)

  const totals = useMemo(() => computePricing(m), [m])

  function set<K extends keyof PricingModel>(k: K, v: PricingModel[K]) { setM(p => ({ ...p, [k]: v })) }
  function setVehicle(k: 'mini' | 'midi' | 'bus', v: number) { setM(p => ({ ...p, vehicle: { ...p.vehicle, [k]: v } })) }
  function setDay(i: number, patch: Partial<PricingDay>) { setM(p => ({ ...p, days: p.days.map((d, j) => j === i ? { ...d, ...patch } : d) })) }

  function addDay() {
    const last = m.days[m.days.length - 1]
    const nextDate = last?.date
      ? new Date(new Date(last.date).getTime() + 86400000).toISOString().slice(0, 10)
      : (group.start_date || '')
    setM(p => ({
      ...p,
      days: [...p.days, {
        date: nextDate,
        hotel: last?.hotel || '',
        board: last?.board || group.meal_plan || 'HB',
        hotel_dbl: last?.hotel_dbl || 0,
        hotel_sgl: last?.hotel_sgl || 0,
        meals: last?.meals || 0,
        entrances: last?.entrances || 0,
        guide_fee: m.guide_fee_per_day,
        shabbat_holiday: 0,
        misc: 0,
        staff: 'none',
      }],
    }))
  }

  function dupDay(i: number) {
    const d = m.days[i]
    const nextDate = d.date ? new Date(new Date(d.date).getTime() + 86400000).toISOString().slice(0, 10) : ''
    setM(p => ({ ...p, days: [...p.days.slice(0, i + 1), { ...d, date: nextDate }, ...p.days.slice(i + 1)] }))
  }
  function removeDay(i: number) { setM(p => ({ ...p, days: p.days.filter((_, j) => j !== i) })) }

  function setTiers(str: string) {
    const tiers = str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0)
    set('tiers', tiers)
  }

  async function save() {
    setBusy(true)
    const best = totals.tierResults[totals.tierResults.length - 1]
    const pricePerPerson = best ? Math.round(best.totalPrice) : null
    const single = best ? Math.round(singleRoomPrice(m, best) - best.totalPrice) : null
    const { error } = await updateGroup(group.id, {
      pricing: m as any,
      price_per_person: pricePerPerson as any,
      single_supplement: single as any,
    })
    setBusy(false)
    if (error) { toast.error('Could not save pricing'); return }
    toast.success('Pricing saved')
    if (pricePerPerson != null && single != null) onSaved?.(pricePerPerson, single)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '5px 7px', border: '0.5px solid #d8d8d8', borderRadius: 6, fontSize: 11.5, outline: 'none', boxSizing: 'border-box', background: '#fff' }
  const num: React.CSSProperties = { ...inp, textAlign: 'right', MozAppearance: 'textfield' as any }

  const TH = ({ label, w, right }: { label: string; w: number; right?: boolean }) => (
    <th style={{ fontSize: 9.5, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.3, padding: '7px 4px', textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap', width: w, minWidth: w }}>
      {label}
    </th>
  )

  return (
    <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, padding: 18, marginBottom: 16 }}>
      <style>{`
        .pricing-table input[type=number]::-webkit-inner-spin-button,
        .pricing-table input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .pricing-table input[type=number] { -moz-appearance: textfield; }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Calculator size={16} color="#534AB7" /> Pricing Calculator
        </div>
        <button onClick={save} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: busy ? 'default' : 'pointer', fontWeight: 600, fontSize: 12, opacity: busy ? 0.6 : 1 }}>
          <Save size={13} /> {busy ? 'Saving…' : 'Save Pricing'}
        </button>
      </div>

      {/* Global settings */}
      <div className="pricing-table" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 14, background: '#fafafa', padding: 10, borderRadius: 8 }}>
        <Field label="Mini /day"><input style={num} type="number" value={m.vehicle.mini} onChange={e => setVehicle('mini', +e.target.value)} /></Field>
        <Field label="Midi /day"><input style={num} type="number" value={m.vehicle.midi} onChange={e => setVehicle('midi', +e.target.value)} /></Field>
        <Field label="Bus /day"><input style={num} type="number" value={m.vehicle.bus} onChange={e => setVehicle('bus', +e.target.value)} /></Field>
        <Field label="Guide /day"><input style={num} type="number" value={m.guide_fee_per_day} onChange={e => set('guide_fee_per_day', +e.target.value)} /></Field>
        <Field label="VAT %"><input style={num} type="number" value={m.vat_percent} onChange={e => set('vat_percent', +e.target.value)} /></Field>
        <Field label="Margin %"><input style={num} type="number" value={m.margin_percent} onChange={e => set('margin_percent', +e.target.value)} /></Field>
      </div>

      {/* Day-by-day table */}
      <div style={{ overflowX: 'auto', marginBottom: 6 }}>
        <table className="pricing-table" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: Object.values(COL).reduce((a, b) => a + b, 0) }}>
          <colgroup>
            <col style={{ width: COL.date }} />
            <col style={{ width: COL.hotel }} />
            <col style={{ width: COL.board }} />
            <col style={{ width: COL.dbl }} />
            <col style={{ width: COL.sgl }} />
            <col style={{ width: COL.meals }} />
            <col style={{ width: COL.entr }} />
            <col style={{ width: COL.guide }} />
            <col style={{ width: COL.shab }} />
            <col style={{ width: COL.misc }} />
            <col style={{ width: COL.staff }} />
            <col style={{ width: COL.actions }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1.5px solid #e0e0e0', background: '#f8f8fc' }}>
              <TH label="Date"      w={COL.date} />
              <TH label="Hotel"     w={COL.hotel} />
              <TH label="Board"     w={COL.board} />
              <TH label="Dbl/pp"    w={COL.dbl}   right />
              <TH label="Sgl"       w={COL.sgl}   right />
              <TH label="Meals/pp"  w={COL.meals} right />
              <TH label="Entr/pp"   w={COL.entr}  right />
              <TH label="Guide"     w={COL.guide}  right />
              <TH label="Shab/Hol" w={COL.shab}   right />
              <TH label="Misc"      w={COL.misc}   right />
              <TH label="Staff"     w={COL.staff} />
              <TH label=""          w={COL.actions} />
            </tr>
          </thead>
          <tbody>
            {m.days.length === 0 ? (
              <tr><td colSpan={12} style={{ padding: 18, textAlign: 'center', color: '#bbb', fontSize: 12 }}>No days yet — click "Add Day" below.</td></tr>
            ) : m.days.map((d, i) => (
              <tr key={i} style={{ borderBottom: '0.5px solid #f3f3f3' }}>
                <td style={{ padding: '3px 3px' }}><input style={{ ...inp, width: '100%' }} type="date" value={d.date} onChange={e => setDay(i, { date: e.target.value })} /></td>
                <td style={{ padding: '3px 3px' }}><input style={{ ...inp, width: '100%' }} value={d.hotel} onChange={e => setDay(i, { hotel: e.target.value })} placeholder="Hotel name" /></td>
                <td style={{ padding: '3px 3px' }}><input style={{ ...inp, width: '100%' }} value={d.board} onChange={e => setDay(i, { board: e.target.value })} /></td>
                <td style={{ padding: '3px 3px' }}><input style={{ ...num, width: '100%' }} type="number" value={d.hotel_dbl} onChange={e => setDay(i, { hotel_dbl: +e.target.value })} /></td>
                <td style={{ padding: '3px 3px' }}><input style={{ ...num, width: '100%' }} type="number" value={d.hotel_sgl} onChange={e => setDay(i, { hotel_sgl: +e.target.value })} /></td>
                <td style={{ padding: '3px 3px' }}><input style={{ ...num, width: '100%' }} type="number" value={d.meals ?? 0} onChange={e => setDay(i, { meals: +e.target.value })} /></td>
                <td style={{ padding: '3px 3px' }}><input style={{ ...num, width: '100%' }} type="number" value={d.entrances ?? 0} onChange={e => setDay(i, { entrances: +e.target.value })} /></td>
                <td style={{ padding: '3px 3px' }}><input style={{ ...num, width: '100%' }} type="number" value={d.guide_fee} onChange={e => setDay(i, { guide_fee: +e.target.value })} /></td>
                <td style={{ padding: '3px 3px' }}><input style={{ ...num, width: '100%' }} type="number" value={d.shabbat_holiday} onChange={e => setDay(i, { shabbat_holiday: +e.target.value })} /></td>
                <td style={{ padding: '3px 3px' }}><input style={{ ...num, width: '100%' }} type="number" value={d.misc} onChange={e => setDay(i, { misc: +e.target.value })} /></td>
                <td style={{ padding: '3px 3px' }}>
                  <select
                    value={d.staff ?? ((d as any).staff_full ? 'full' : 'none')}
                    onChange={e => setDay(i, { staff: e.target.value as 'none' | 'half' | 'full' })}
                    style={{ ...inp, width: '100%', background: d.staff === 'full' ? '#E6F1FB' : d.staff === 'half' ? '#FAEEDA' : '#fff', color: d.staff === 'full' ? '#185FA5' : d.staff === 'half' ? '#854F0B' : '#999', fontWeight: d.staff !== 'none' ? 600 : 400 }}>
                    <option value="none">—</option>
                    <option value="half">½ Staff</option>
                    <option value="full">Full Staff</option>
                  </select>
                </td>
                <td style={{ padding: '3px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <button onClick={() => dupDay(i)} title="Duplicate" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 2 }}><Copy size={12} /></button>
                  <button onClick={() => removeDay(i)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 2 }}><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>

          {/* Totals row */}
          {m.days.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '1.5px solid #e0e0e0', background: '#f8f8fc' }}>
                <td colSpan={3} style={{ padding: '6px 8px', fontSize: 10.5, fontWeight: 700, color: '#888' }}>TOTAL</td>
                <td style={{ padding: '6px 4px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#1a2a3a' }}>{formatMoney(totals.totalHotelDbl, cur)}</td>
                <td />
                <td style={{ padding: '6px 4px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#0F6E56' }}>{formatMoney(totals.totalMeals, cur)}</td>
                <td style={{ padding: '6px 4px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#534AB7' }}>{formatMoney(totals.totalEntrances, cur)}</td>
                <td style={{ padding: '6px 4px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#854F0B' }}>{formatMoney(totals.totalGuideOvernight, cur)}</td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <button onClick={addDay} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#EEEDFE', color: '#534AB7', border: '0.5px solid #B5AEE8', borderRadius: 20, padding: '5px 13px', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
        <Plus size={13} /> Add Day
      </button>

      {/* Cost summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16, fontSize: 12 }}>
        <Summary label="Days"           value={String(totals.numDays)} />
        <Summary label="Hotel /pp"      value={formatMoney(totals.totalHotelDbl, cur)}       color="#1a2a3a" />
        <Summary label="Meals /pp"      value={formatMoney(totals.totalMeals, cur)}           color="#0F6E56" />
        <Summary label="Entrances /pp"  value={formatMoney(totals.totalEntrances, cur)}       color="#534AB7" />
        <Summary label="Guide + Staff"  value={formatMoney(totals.totalGuideOvernight, cur)}  color="#854F0B" />
      </div>

      {/* Tiers + FOC */}
      <div style={{ background: '#FAFAFE', border: '0.5px solid #E5E3F5', borderRadius: 10, padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 10.5, color: '#888', fontWeight: 500, display: 'block', marginBottom: 3 }}>Tier low bounds (comma separated)</label>
            <input style={inp} value={m.tiers.join(', ')} onChange={e => setTiers(e.target.value)} placeholder="14, 20, 25, 30, 35, 40" />
          </div>
          <div>
            <label style={{ fontSize: 10.5, color: '#888', fontWeight: 500, display: 'block', marginBottom: 3 }}>Range span</label>
            <input style={num} type="number" value={m.tier_span} onChange={e => set('tier_span', Math.max(1, +e.target.value))} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 10.5, color: '#854F0B', fontWeight: 600, display: 'block', marginBottom: 3 }}>FOC – Hotel free (room free, meals+entr spread)</label>
            <input style={num} type="number" min={0} value={m.foc_hotel} onChange={e => set('foc_hotel', Math.max(0, +e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: 10.5, color: '#534AB7', fontWeight: 600, display: 'block', marginBottom: 3 }}>FOC – Full free (hotel+meals+entr spread)</label>
            <input style={num} type="number" min={0} value={m.foc_full} onChange={e => set('foc_full', Math.max(0, +e.target.value))} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 10.5, color: '#888', fontWeight: 500, display: 'block', marginBottom: 3 }}>Note next to ranges (free text, shown on quote)</label>
          <input style={inp} value={m.tier_note} onChange={e => set('tier_note', e.target.value)} placeholder="e.g. 1 FOC included · prices subject to availability" />
        </div>
      </div>

      {/* Price tier table */}
      <div style={{ overflowX: 'auto', border: '0.5px solid #eee', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr style={{ background: '#1a2a3a' }}>
              {[['Group Size','left'],['Net Base /pp','right'],['FOC /pp','right'],['Price /pp (Double)','right'],['Single Room','right']].map(([lbl,align]) => (
                <th key={lbl} style={{ fontSize: 9.5, fontWeight: 600, color: '#fff', padding: '8px 12px', textAlign: align as any, letterSpacing: 0.3 }}>{lbl}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {totals.tierResults.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 14, textAlign: 'center', color: '#bbb', fontSize: 12 }}>Add days and pax tiers to see pricing.</td></tr>
            ) : totals.tierResults.map((t, i) => (
              <tr key={i} style={{ borderBottom: '0.5px solid #f5f5f5', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600 }}>{t.pax}–{t.paxHigh} pax</td>
                <td style={{ padding: '9px 12px', fontSize: 12.5, textAlign: 'right', color: '#888' }}>{formatMoney(t.totalNetBase, cur)}</td>
                <td style={{ padding: '9px 12px', fontSize: 12, textAlign: 'right', color: t.focAlloc ? '#854F0B' : '#ccc' }}>{t.focAlloc ? formatMoney(t.focAlloc, cur) : '—'}</td>
                <td style={{ padding: '9px 12px', fontSize: 14, textAlign: 'right', fontWeight: 700, color: '#0F6E56' }}>{formatMoney(t.totalPrice, cur)}</td>
                <td style={{ padding: '9px 12px', fontSize: 12.5, textAlign: 'right', color: '#534AB7' }}>{formatMoney(singleRoomPrice(m, t), cur)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 10.5, color: '#aaa', marginTop: 8, lineHeight: 1.5 }}>
        Price divided by the tier low bound minus FOC. FOC "hotel free" spreads only meals+entrances; FOC "full" spreads hotel+meals+entrances. Vehicle &amp; guide are never part of FOC. Staff overnight always includes VAT (½ or full rate).
      </div>
    </div>
  )
}

function normalize(p: any): PricingModel {
  if (!p || typeof p !== 'object') return { ...DEFAULT_PRICING, days: [] }
  return {
    vehicle:            { mini: p.vehicle?.mini ?? 450, midi: p.vehicle?.midi ?? 550, bus: p.vehicle?.bus ?? 600 },
    guide_fee_per_day:  p.guide_fee_per_day ?? 300,
    vat_percent:        p.vat_percent ?? 18,
    margin_percent:     p.margin_percent ?? 20,
    tiers:              Array.isArray(p.tiers) && p.tiers.length ? p.tiers : [14, 20, 25, 30, 35, 40],
    tier_span:          p.tier_span ?? 5,
    foc_hotel:          p.foc_hotel ?? 0,
    foc_full:           p.foc_full ?? 0,
    tier_note:          p.tier_note ?? '',
    days: Array.isArray(p.days) ? p.days.map((d: any) => ({
      date:            d.date ?? '',
      hotel:           d.hotel ?? '',
      board:           d.board ?? 'HB',
      hotel_dbl:       Number(d.hotel_dbl) || 0,
      hotel_sgl:       Number(d.hotel_sgl) || 0,
      meals:           Number(d.meals)     || 0,
      entrances:       Number(d.entrances) || 0,
      guide_fee:       Number(d.guide_fee) || 0,
      shabbat_holiday: Number(d.shabbat_holiday) || 0,
      misc:            Number(d.misc)      || 0,
      // backward compat: old 'staff_full' boolean → new 'staff' enum
      staff: d.staff ?? (d.staff_full ? 'full' : 'none'),
    })) : [],
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 9.5, color: '#888', fontWeight: 500, display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</label>
      {children}
    </div>
  )
}

function Summary({ label, value, color = '#1a2a3a' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: '#fafafa', borderRadius: 8, padding: '8px 12px', borderLeft: `3px solid ${color}20` }}>
      <div style={{ fontSize: 10, color: '#999' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  )
}

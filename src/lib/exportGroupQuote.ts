import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, BorderStyle,
  Table, TableRow, TableCell, WidthType, ShadingType,
  VerticalAlign,
} from 'docx'
import { CompanySettings } from './companySettings'
import { PricingModel, computePricing, singleRoomPrice } from './groupPricing'
import { ClientItinerary, dayDate } from './itineraries'
import { LOGO_SRC } from './logo'

const NAVY  = '1a2a3a'
const GOLD  = 'f5c842'
const LIGHT = 'f0f4f8'

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
  'Travel insurance (strongly recommended)',
]

function fmtDate(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmt(n: number, cur: string) {
  return `${cur} ${Math.round(n).toLocaleString()}`
}

// Build hotel programme from pricing days
function buildHotelProgramme(model: PricingModel) {
  const rows: { from: string; to: string; hotel: string; board: string; nights: number }[] = []
  let cur: any = null
  for (const d of model.days || []) {
    if (!d.hotel) continue
    if (cur && cur.hotel === d.hotel && cur.board === d.board) {
      cur.to = d.date; cur.nights++
    } else {
      if (cur) rows.push(cur)
      cur = { from: d.date, to: d.date, hotel: d.hotel, board: d.board, nights: 1 }
    }
  }
  if (cur) rows.push(cur)
  return rows
}

// ── helpers ─────────────────────────────────────────────────────

function section(title: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 22, color: NAVY })],
    spacing: { before: 320, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 4 } },
  })
}

function cell(text: string, opts?: { bold?: boolean; shade?: boolean; right?: boolean; color?: string }) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold: opts?.bold, size: 20, color: opts?.color || (opts?.shade ? 'ffffff' : '333333') })],
      alignment: opts?.right ? AlignmentType.RIGHT : AlignmentType.LEFT,
    })],
    shading: opts?.shade ? { type: ShadingType.SOLID, color: NAVY } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  })
}

function headerTable(group: any, company: CompanySettings): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({ children: [new TextRun({ text: company.company_name || 'Erez Yarkon Travel', bold: true, size: 36, color: NAVY })], spacing: { after: 60 } }),
            new Paragraph({ children: [new TextRun({ text: 'GROUP QUOTATION', size: 24, color: GOLD, bold: true })], spacing: { after: 40 } }),
            new Paragraph({ children: [new TextRun({ text: `${company.website || 'erezyarkon.com'} · ${company.phone || ''}`, size: 18, color: '888888' })] }),
          ],
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({ children: [new TextRun({ text: group.name, bold: true, size: 22, color: NAVY })], alignment: AlignmentType.RIGHT, spacing: { after: 60 } }),
            new Paragraph({ children: [new TextRun({ text: `Quote date: ${fmtDate(new Date().toISOString())}`, size: 18, color: '888888' })], alignment: AlignmentType.RIGHT }),
          ],
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          verticalAlign: VerticalAlign.TOP,
        }),
      ],
    })],
  })
}

// ── main export ─────────────────────────────────────────────────

export async function exportGroupQuoteToWord(opts: {
  group: any
  itinerary: ClientItinerary | null
  company: CompanySettings
}): Promise<void> {
  const { group, itinerary, company } = opts
  const cur = group.currency || 'USD'
  const model: PricingModel | null = group.pricing?.days?.length > 0 ? group.pricing : null
  const totals = model ? computePricing(model) : null
  const programme = model ? buildHotelProgramme(model) : []
  const itineraryDays = itinerary?.days || []

  const children: Paragraph[] = []

  // ── Cover ────────────────────────────────────────────────────
  children.push(
    new Paragraph({ text: '', spacing: { after: 800 } }),
    new Paragraph({ children: [new TextRun({ text: company.company_name || 'Erez Yarkon Travel', bold: true, size: 56, color: NAVY })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun({ text: 'GROUP QUOTATION', bold: true, size: 36, color: GOLD })], alignment: AlignmentType.CENTER, spacing: { after: 160 } }),
    new Paragraph({ children: [new TextRun({ text: group.name, bold: true, size: 44, color: NAVY })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: group.destination || 'Holy Land', size: 28, color: '888888' })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    new Paragraph({ children: [new TextRun({ text: group.start_date ? `${fmtDate(group.start_date)} – ${fmtDate(group.end_date)}` : '', size: 24, color: '888888' })], alignment: AlignmentType.CENTER, spacing: { after: 600 } }),
    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 1 } }, spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun({ text: `Prepared by: ${company.company_name}  ·  ${company.phone || ''}  ·  ${company.email || ''}`, size: 18, color: '888888' })], alignment: AlignmentType.CENTER, spacing: { after: 800 } }),
    new Paragraph({ pageBreakBefore: true, text: '' }),
  )

  // ── Tour overview ────────────────────────────────────────────
  children.push(section('Tour Overview'))
  const overviewRows: [string, string][] = []
  if (group.start_date) overviewRows.push(['Tour Period', `${fmtDate(group.start_date)} – ${fmtDate(group.end_date)}${group.nights ? ` (${group.nights + 1} Days / ${group.nights} Nights)` : ''}`])
  if (group.destination) overviewRows.push(['Destination', group.destination])
  if (group.meal_plan) overviewRows.push(['Meal Plan', group.meal_plan === 'HB' ? 'Half Board – Breakfast & Dinner daily' : group.meal_plan])
  overviewRows.push(['Transport', 'Luxury air-conditioned coach (size matched to group)'])
  overviewRows.push(['Guide', 'Licensed professional English-speaking guide throughout'])
  overviewRows.push(['Quote Date', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })])

  children.push(new Paragraph({ text: '', spacing: { after: 40 } }))

  const ovTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: overviewRows.map(([k, v], i) => new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 20, color: NAVY })] })],
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'f5f7fa' : 'ffffff' },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: v, size: 20, color: '333333' })] })],
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'f5f7fa' : 'ffffff' },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }),
      ],
    })),
  })
  children.push(new Paragraph({ text: '', spacing: { after: 40 } }))
  // push table via workaround (docx tables go into sections.children directly)

  // ── Rates ─────────────────────────────────────────────────────
  children.push(section(`Rates Per Person (${cur})`))
  children.push(new Paragraph({ children: [new TextRun({ text: 'Based on double room sharing. Minimum numbers apply.', size: 18, color: '888888', italics: true })], spacing: { after: 80 } }))

  // ── Hotel programme ───────────────────────────────────────────
  if (programme.length > 0) {
    children.push(section('Hotel Programme'))
  }

  // ── Day-by-day itinerary ──────────────────────────────────────
  if (itineraryDays.length > 0) {
    children.push(new Paragraph({ pageBreakBefore: true, text: '' }))
    children.push(section('Day-by-Day Itinerary'))

    itineraryDays.forEach((day, idx) => {
      const date = dayDate(itinerary?.start_date || null, day.day_number)
      const dateStr = date ? new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Day ${day.day_number}  `, bold: true, size: 26, color: GOLD }),
            new TextRun({ text: day.title, bold: true, size: 26, color: NAVY }),
          ],
          spacing: { before: idx === 0 ? 40 : 300, after: 60 },
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: NAVY, space: 8 } },
        }),
      )
      if (dateStr || day.depart_time) {
        const timeParts: string[] = []
        if (dateStr) timeParts.push(dateStr)
        if (day.depart_time && day.return_time) timeParts.push(`${day.depart_time} – ${day.return_time}`)
        else if (day.depart_time) timeParts.push(`Depart ${day.depart_time}`)
        children.push(new Paragraph({ children: [new TextRun({ text: timeParts.join('  ·  '), size: 18, color: '999999', italics: true })], spacing: { after: 80 } }))
      }
      ;(day.content || '').split('\n').filter(p => p.trim()).forEach(text => {
        children.push(new Paragraph({ children: [new TextRun({ text, size: 20, color: '333333' })], spacing: { after: 80 }, alignment: AlignmentType.JUSTIFIED }))
      })
      if (idx < itineraryDays.length - 1) {
        children.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'eeeeee', space: 2 } }, spacing: { after: 40 } }))
      }
    })
  }

  // ── Includes / Excludes ───────────────────────────────────────
  children.push(new Paragraph({ pageBreakBefore: true, text: '' }))
  children.push(section('Rates Include'))
  DEFAULT_INCLUDES.forEach(x => children.push(new Paragraph({ children: [new TextRun({ text: `✓  ${x}`, size: 20, color: '333333' })], spacing: { after: 40 } })))
  children.push(section('Rates Do Not Include'))
  DEFAULT_EXCLUDES.forEach(x => children.push(new Paragraph({ children: [new TextRun({ text: `✗  ${x}`, size: 20, color: '555555' })], spacing: { after: 40 } })))

  // ── Sign off ──────────────────────────────────────────────────
  children.push(
    new Paragraph({ text: '', spacing: { before: 400 } }),
    new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: GOLD, space: 4 } }, spacing: { before: 40, after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: 'We look forward to welcoming your group to the Holy Land and ensuring an unforgettable experience.', size: 20, color: '333333' })], spacing: { after: 160 } }),
    new Paragraph({ children: [new TextRun({ text: company.legal_name || company.company_name || 'Erez Yarkon Travel', bold: true, size: 22, color: NAVY })], spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: `Tel: ${company.phone || ''}`, size: 20, color: '666666' })], spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: company.email || '', size: 20, color: '666666' })], spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: company.website || 'www.erezyarkon.com', size: 20, color: '666666' })], spacing: { after: 40 } }),
  )

  // ── Build tables & document ───────────────────────────────────
  const ratesTable: Table | null = totals && totals.tierResults.length > 0
    ? new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell('Group Size', { shade: true, bold: true }), cell('Price Per Person (Double Room)', { shade: true, bold: true, right: true }), cell('Single Supplement', { shade: true, bold: true, right: true })] }),
          ...totals.tierResults.map((t, i) => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${t.pax}–${t.paxHigh} passengers`, size: 20 })] })], shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'f5f7fa' : 'ffffff' }, margins: { top: 60, bottom: 60, left: 80, right: 80 } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(t.totalPrice, cur), bold: true, size: 22, color: NAVY })], alignment: AlignmentType.RIGHT })], shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'f5f7fa' : 'ffffff' }, margins: { top: 60, bottom: 60, left: 80, right: 80 } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(singleRoomPrice(model!, t) - t.totalPrice, cur), size: 20, color: '666666' })], alignment: AlignmentType.RIGHT })], shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'f5f7fa' : 'ffffff' }, margins: { top: 60, bottom: 60, left: 80, right: 80 } }),
            ],
          })),
        ],
      })
    : null

  const hotelTable: Table | null = programme.length > 0
    ? new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell('Dates', { shade: true, bold: true }), cell('Hotel', { shade: true, bold: true }), cell('Nights', { shade: true, bold: true }), cell('Board', { shade: true, bold: true })] }),
          ...programme.map((r, i) => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${fmtDate(r.from)} – ${fmtDate(r.to)}`, size: 20 })] })], shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'f5f7fa' : 'ffffff' }, margins: { top: 60, bottom: 60, left: 80, right: 80 } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: r.hotel, bold: true, size: 20 })] })], shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'f5f7fa' : 'ffffff' }, margins: { top: 60, bottom: 60, left: 80, right: 80 } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(r.nights), size: 20 })], alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'f5f7fa' : 'ffffff' }, margins: { top: 60, bottom: 60, left: 80, right: 80 } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: r.board, size: 20 })], alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'f5f7fa' : 'ffffff' }, margins: { top: 60, bottom: 60, left: 80, right: 80 } }),
            ],
          })),
        ],
      })
    : null

  // Splice tables into the correct positions in children
  // Find index of section('Rates Per Person')
  const ratesIdx = children.findIndex(p => (p as any).root?.[0]?.options?.text?.includes('RATES PER PERSON') || JSON.stringify(p).includes('RATES PER PERSON'))

  const sectionChildren: (Paragraph | Table)[] = []
  for (const ch of children) {
    const text = JSON.stringify(ch)
    sectionChildren.push(ch)
    if (text.includes('TOUR OVERVIEW')) {
      sectionChildren.push(ovTable)
    }
    if (ratesTable && text.includes(`RATES PER PERSON`)) {
      sectionChildren.push(ratesTable)
    }
    if (hotelTable && text.includes('HOTEL PROGRAMME')) {
      sectionChildren.push(hotelTable)
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 20, color: '333333' } } } },
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1134, right: 1134 } } },
      children: sectionChildren as any,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${(group.name || 'Group Quote').replace(/[^a-zA-Z0-9 ]/g, '').trim()}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

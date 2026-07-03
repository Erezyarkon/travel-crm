import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, PageBreak, BorderStyle, ShadingType,
  Header, Footer, PageNumber, NumberFormat,
  TableOfContents,
} from 'docx'
import { ClientItinerary, dayDate } from './itineraries'
import { CompanySettings } from './companySettings'

export async function exportItineraryToWord(
  itinerary: ClientItinerary,
  groupName: string,
  company: CompanySettings,
): Promise<void> {
  const navy = '1a2a3a'
  const gold  = 'f5c842'

  const children: Paragraph[] = []

  // ── Cover block ──────────────────────────────────────────
  children.push(
    new Paragraph({ text: '', spacing: { after: 200 } }),
    new Paragraph({
      children: [new TextRun({ text: company.company_name || 'Erez Yarkon Travel', bold: true, size: 44, color: navy })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: itinerary.title, bold: true, size: 36, color: navy })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: groupName, size: 24, color: '666666' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: itinerary.start_date
          ? `Starting ${new Date(itinerary.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
          : '',
        size: 22, color: '888888',
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    // Gold separator
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: gold, space: 4 } },
      spacing: { after: 600 },
    }),
  )

  // ── Days ─────────────────────────────────────────────────
  const days = itinerary.days || []
  days.forEach((day, idx) => {
    const date = dayDate(itinerary.start_date, day.day_number)
    const dateStr = date
      ? new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : ''

    // Day header
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Day ${day.day_number}  `, bold: true, size: 26, color: gold }),
          new TextRun({ text: day.title, bold: true, size: 26, color: navy }),
        ],
        spacing: { before: idx === 0 ? 0 : 320, after: 60 },
        border: { left: { style: BorderStyle.SINGLE, size: 20, color: navy, space: 8 } },
      }),
    )

    // Date + times
    if (dateStr || day.depart_time || day.return_time) {
      const timeParts: string[] = []
      if (dateStr) timeParts.push(dateStr)
      if (day.depart_time && day.return_time) timeParts.push(`${day.depart_time} – ${day.return_time}`)
      else if (day.depart_time) timeParts.push(`Depart ${day.depart_time}`)
      children.push(
        new Paragraph({
          children: [new TextRun({ text: timeParts.join('  ·  '), size: 18, color: '999999', italics: true })],
          spacing: { after: 100 },
        }),
      )
    }

    // Content paragraphs (split on \n)
    const paragraphs = (day.content || '').split('\n').filter(p => p.trim())
    paragraphs.forEach(text => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text, size: 22, color: '333333' })],
          spacing: { after: 100 },
          alignment: AlignmentType.JUSTIFIED,
        }),
      )
    })
    if (paragraphs.length === 0) {
      children.push(new Paragraph({ text: '', spacing: { after: 100 } }))
    }

    // Thin gold rule between days (not after last)
    if (idx < days.length - 1) {
      children.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'eeeeee', space: 2 } },
          spacing: { after: 40 },
        }),
      )
    }
  })

  // ── Footer note ──────────────────────────────────────────
  children.push(
    new Paragraph({ text: '', spacing: { before: 400 } }),
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'cccccc', space: 4 } },
      spacing: { before: 40 },
      children: [new TextRun({
        text: `${company.company_name || 'EYT Travel'} · ${company.website || 'erezyarkon.com'} · ${company.phone || ''}`,
        size: 16, color: '999999',
      })],
      alignment: AlignmentType.CENTER,
    }),
  )

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Georgia', size: 22, color: '333333' },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 }, // 2cm margins
        },
      },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${itinerary.title.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'itinerary'}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

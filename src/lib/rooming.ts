import ExcelJS from 'exceljs'
import { ROOMING_TEMPLATE_B64 } from './roomingTemplate'

export interface Room {
  last_name: string
  first_name: string
  adult: number
  junior: number
  children: number
  infant: number
  share: number       // beds in the room
  order: string
  arrival: string
  departure: string
  nationality: string
  passport: string
  passport2: string
  dob: string
  comments: string
}

export function emptyRoom(defaults?: Partial<Room>): Room {
  return {
    last_name: '', first_name: '', adult: 2, junior: 0, children: 0, infant: 0,
    share: 2, order: '', arrival: '', departure: '', nationality: '',
    passport: '', passport2: '', dob: '', comments: '', ...defaults,
  }
}

export function roomPaxCount(r: Room): number {
  return (Number(r.adult) || 0) + (Number(r.junior) || 0) + (Number(r.children) || 0) + (Number(r.infant) || 0)
}

function fmtDate(d: string): string {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function b64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64)
  const len = bin.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// Parse a filled rooming Excel (in the hotel template format) back into rooms.
// Reads data rows starting at row 13, columns A–O.
export async function importRoomingList(file: File): Promise<{ rooms: Room[]; guideDriver: string | null; error: string | null }> {
  try {
    const buf = await file.arrayBuffer()
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buf)
    const ws = wb.getWorksheet('Rooming List ') || wb.worksheets[0]
    if (!ws) return { rooms: [], guideDriver: null, error: 'Sheet not found' }

    const guideDriver = cellText(ws.getCell('C10')) || null

    const rooms: Room[] = []
    for (let r = 13; r <= 80; r++) {
      const last = cellText(ws.getCell('A' + r))
      const first = cellText(ws.getCell('B' + r))
      const adult = cellNum(ws.getCell('C' + r))
      const junior = cellNum(ws.getCell('D' + r))
      const children = cellNum(ws.getCell('E' + r))
      const infant = cellNum(ws.getCell('F' + r))
      const share = cellNum(ws.getCell('G' + r))
      // Stop if the row is completely empty (name + counts all blank)
      if (!last && !first && !adult && !junior && !children && !infant && !share) {
        // peek a couple more rows to allow gaps; if next 2 also empty, stop
        const a2 = cellText(ws.getCell('A' + (r + 1))) || cellText(ws.getCell('B' + (r + 1)))
        const a3 = cellText(ws.getCell('A' + (r + 2))) || cellText(ws.getCell('B' + (r + 2)))
        if (!a2 && !a3) break
        continue
      }
      rooms.push({
        last_name: last,
        first_name: first,
        adult: adult || 0,
        junior: junior || 0,
        children: children || 0,
        infant: infant || 0,
        share: share || 0,
        order: cellText(ws.getCell('H' + r)),
        arrival: cellDate(ws.getCell('I' + r)),
        departure: cellDate(ws.getCell('J' + r)),
        nationality: cellText(ws.getCell('K' + r)),
        passport: cellText(ws.getCell('L' + r)),
        passport2: cellText(ws.getCell('N' + r)),
        dob: cellDate(ws.getCell('M' + r)),
        comments: cellText(ws.getCell('O' + r)),
      })
    }
    return { rooms, guideDriver, error: null }
  } catch (e: any) {
    return { rooms: [], guideDriver: null, error: e?.message || 'Could not read file' }
  }
}

function cellText(cell: any): string {
  const v = cell?.value
  if (v == null) return ''
  if (typeof v === 'object') {
    if (v.text) return String(v.text).trim()
    if (v.result != null) return String(v.result).trim()
    if (v.richText) return v.richText.map((t: any) => t.text).join('').trim()
    if (v instanceof Date) return ''
  }
  return String(v).trim()
}

function cellNum(cell: any): number {
  const t = cellText(cell)
  const n = parseInt(t, 10)
  return isNaN(n) ? 0 : n
}

function cellDate(cell: any): string {
  const v = cell?.value
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  // Excel serial number → date
  if (typeof v === 'number' && v > 30000 && v < 60000) {
    const ms = (v - 25569) * 86400 * 1000
    const d = new Date(ms)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  return ''
}


// Fill the hotel template (preserving logo + styling) and trigger a download.
export async function exportRoomingList(group: any, rooms: Room[]) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(b64ToUint8(ROOMING_TEMPLATE_B64).buffer)
  const ws = wb.getWorksheet('Rooming List ') || wb.worksheets[0]

  // Header fields
  ws.getCell('C6').value = 'Erez Yarkon Travel Ltd'
  ws.getCell('C7').value = group.name || ''
  const dateRange = group.start_date
    ? `${fmtDate(group.start_date)} - ${fmtDate(group.end_date)}`
    : ''
  ws.getCell('C8').value = dateRange
  ws.getCell('C9').value = group.meal_plan || 'HB'
  ws.getCell('C10').value = group.guide_driver || ''

  // Clear any existing data rows (13 onward up to 60)
  for (let r = 13; r <= 60; r++) {
    ;['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'].forEach(col => {
      ws.getCell(col + r).value = null
    })
  }

  // Write rooms starting at row 13
  let r = 13
  for (const room of rooms) {
    ws.getCell('A' + r).value = room.last_name || ''
    ws.getCell('B' + r).value = room.first_name || ''
    ws.getCell('C' + r).value = room.adult || null
    ws.getCell('D' + r).value = room.junior || null
    ws.getCell('E' + r).value = room.children || null
    ws.getCell('F' + r).value = room.infant || null
    ws.getCell('G' + r).value = room.share || null
    ws.getCell('H' + r).value = room.order || null
    const arrCell = ws.getCell('I' + r)
    arrCell.value = room.arrival ? new Date(room.arrival) : null
    if (room.arrival) arrCell.numFmt = 'dd-mmm-yy'
    const depCell = ws.getCell('J' + r)
    depCell.value = room.departure ? new Date(room.departure) : null
    if (room.departure) depCell.numFmt = 'dd-mmm-yy'
    ws.getCell('K' + r).value = room.nationality || null
    const passCell = ws.getCell('L' + r)
    if (room.passport) { passCell.value = room.passport; passCell.numFmt = '@' } else { passCell.value = null }
    const dobCell = ws.getCell('M' + r)
    dobCell.value = room.dob ? new Date(room.dob) : null
    if (room.dob) dobCell.numFmt = 'dd-mmm-yy'
    const pass2Cell = ws.getCell('N' + r)
    if (room.passport2) { pass2Cell.value = room.passport2; pass2Cell.numFmt = '@' } else { pass2Cell.value = null }
    ws.getCell('O' + r).value = room.comments || null
    r++
  }

  // The template's hotel dropdown is an x14 extension validation that ExcelJS
  // doesn't preserve, and its numeric/date validations span millions of rows
  // (causing a "problem with content" warning). Fix: clear all, then re-add the
  // hotel dropdown as a standard list validation referencing the same range.
  try {
    const anyWs = ws as any
    if (anyWs.dataValidations && anyWs.dataValidations.model) {
      anyWs.dataValidations.model = {}
    }
    ws.getCell('O4').dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['Sheet1!$L$4:$L$18'],
      showInputMessage: true,
      promptTitle: 'Please choose Hotel',
      prompt: 'Select the hotel for this rooming list',
    }
  } catch { /* ignore */ }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Rooming List - ${(group.name || 'Group').replace(/[^\w\s-]/g, '')}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

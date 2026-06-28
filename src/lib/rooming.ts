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

function b64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64)
  const len = bin.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function fmtDate(d: string): string {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
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
    ws.getCell('I' + r).value = room.arrival ? new Date(room.arrival) : null
    ws.getCell('J' + r).value = room.departure ? new Date(room.departure) : null
    ws.getCell('K' + r).value = room.nationality || null
    ws.getCell('L' + r).value = room.passport || null
    ws.getCell('M' + r).value = room.dob ? new Date(room.dob) : null
    ws.getCell('N' + r).value = room.passport2 || null
    ws.getCell('O' + r).value = room.comments || null
    r++
  }

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

// Lightweight CSV export — no dependencies, opens directly in Excel.

type Column<T> = { header: string; value: (row: T) => string | number | null | undefined }

function escapeCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  // Quote if the value contains comma, quote, or newline
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function exportToCsv<T>(filename: string, rows: T[], columns: Column<T>[]): void {
  const header = columns.map(c => escapeCell(c.header)).join(',')
  const body = rows.map(r => columns.map(c => escapeCell(c.value(r))).join(',')).join('\r\n')
  // BOM so Excel reads UTF-8 (Hebrew, accents) correctly
  const csv = '\uFEFF' + header + '\r\n' + body

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `${filename}-${stamp}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

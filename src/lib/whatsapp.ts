// Lightweight WhatsApp deep-link helper.
// Builds a wa.me link with a prefilled message — no API keys, no backend needed.

/** Normalize a phone number into the digits-only format wa.me expects. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  let digits = raw.replace(/[^\d+]/g, '')
  if (!digits) return null
  // Strip a leading +
  digits = digits.replace(/^\+/, '')
  // Israeli local numbers (05X-XXXXXXX or 0XXXXXXXXX) -> country code 972
  if (digits.startsWith('0')) {
    digits = '972' + digits.slice(1)
  }
  return digits
}

export function buildWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  const normalized = normalizePhone(phone)
  if (!normalized) return null
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${normalized}?text=${encoded}`
}

export function openWhatsApp(phone: string | null | undefined, message: string): boolean {
  const link = buildWhatsAppLink(phone, message)
  if (!link) return false
  window.open(link, '_blank', 'noopener,noreferrer')
  return true
}

// --- Message templates ---

export function quoteMessage(opts: {
  clientName: string
  serviceName?: string
  totalPrice?: number
  currency?: string
  companyName?: string
  fileNumber?: string
}): string {
  const { clientName, serviceName, totalPrice, currency = 'USD', companyName = 'Erez Yarkon Travel', fileNumber } = opts
  const firstName = clientName?.split(' ')[0] || ''
  let msg = `Hi ${firstName}, this is ${companyName}.\n\n`
  if (serviceName) msg += `Here is your quote for: ${serviceName}\n`
  if (totalPrice) msg += `Total: ${currency} ${totalPrice.toLocaleString()}\n`
  if (fileNumber) msg += `File: ${fileNumber}\n`
  msg += `\nPlease let us know if you'd like to confirm or have any questions.`
  return msg
}

export function voucherMessage(opts: {
  clientName: string
  serviceName?: string
  fileNumber?: string
  companyName?: string
}): string {
  const { clientName, serviceName, fileNumber, companyName = 'Erez Yarkon Travel' } = opts
  const firstName = clientName?.split(' ')[0] || ''
  let msg = `Hi ${firstName}, this is ${companyName}.\n\n`
  msg += `Your voucher${serviceName ? ` for ${serviceName}` : ''} is confirmed and ready.\n`
  if (fileNumber) msg += `File: ${fileNumber}\n`
  msg += `\nPlease keep this for your records and present it to the service provider. Safe travels!`
  return msg
}

export function generalMessage(clientName: string, companyName = 'Erez Yarkon Travel'): string {
  const firstName = clientName?.split(' ')[0] || ''
  return `Hi ${firstName}, this is ${companyName}. `
}

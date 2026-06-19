export const CURRENCIES = ['USD', 'EUR', 'ILS'] as const
export type Currency = typeof CURRENCIES[number]

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  ILS: '₪',
}

export function currencySymbol(code: string | null | undefined): string {
  return CURRENCY_SYMBOLS[code || 'USD'] || '$'
}

export function formatMoney(amount: number | null | undefined, currency: string | null | undefined): string {
  const n = Number(amount) || 0
  const sym = currencySymbol(currency)
  return `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

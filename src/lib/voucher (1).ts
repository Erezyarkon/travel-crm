// Voucher number generator — VCH-2025-0001 format
export function generateVoucherNumber(): string {
  const year = new Date().getFullYear()
  const seq = String(Date.now()).slice(-4).padStart(4, '0')
  return `VCH-${year}-${seq}`
}

export function formatDate(date: string): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

export const STATUS_LABELS: Record<string, string> = {
  inquiry: 'Inquiry',
  quoted: 'Quoted', 
  confirmed: 'Confirmed',
  paid: 'Paid',
  voucher_sent: 'Voucher Sent',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

export const BOOKING_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  hotel:      { color: '#185FA5', bg: '#E6F1FB', label: 'Hotel Booking' },
  car_rental: { color: '#0F6E56', bg: '#E1F5EE', label: 'Car Rental' },
  transfer:   { color: '#854F0B', bg: '#FAEEDA', label: 'Transfer' },
  day_trip:   { color: '#3B6D11', bg: '#EAF3DE', label: 'Day Trip' },
  entrance:   { color: '#534AB7', bg: '#EEEDFE', label: 'Entrance Fees' },
  meals:      { color: '#993556', bg: '#FBEAF0', label: 'Meals & Restaurant' },
  flight:     { color: '#0C447C', bg: '#B5D4F4', label: 'Flight Booking' },
  vip:        { color: '#B8860B', bg: '#FFF8E6', label: 'VIP Airport Service' },
}

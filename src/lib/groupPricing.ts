// Group pricing model — replicates the Excel "Group Pricing" sheet.

export interface PricingDay {
  date: string
  hotel: string
  board: string
  hotel_dbl: number      // hotel cost per person sharing double
  hotel_sgl: number      // single room portion (per person in single)
  guide_fee: number      // guide fee for the day (usually flat 300)
  shabbat_holiday: number // surcharge for Shabbat/holiday
  misc: number           // variable misc / entrances for the day
  staff_full: boolean    // staff overnight at full rate (×1.18) vs half (÷2)
}

export interface PricingModel {
  vehicle: { mini: number; midi: number; bus: number }  // per-day vehicle cost
  guide_fee_per_day: number
  vat_percent: number      // applied to staff overnight (default 18)
  margin_percent: number   // profit margin (default 20)
  tiers: number[]          // pax tiers to price (e.g. [14,19,24,29,34,39,44])
  days: PricingDay[]
}

export const DEFAULT_PRICING: PricingModel = {
  vehicle: { mini: 450, midi: 550, bus: 600 },
  guide_fee_per_day: 300,
  vat_percent: 18,
  margin_percent: 20,
  tiers: [19, 24, 29, 34, 39, 44],
  days: [],
}

export interface TierResult {
  pax: number
  transportAlloc: number
  staffAlloc: number
  netBaseCost: number      // hotel + misc per person
  totalNetBase: number     // allocations + net base
  totalPrice: number       // × (1 + margin)
}

export interface PricingTotals {
  totalMini: number
  totalMidi: number
  totalBus: number
  totalGuideOvernight: number  // guide fees + staff overnight + shabbat
  totalHotelDbl: number        // sum of per-person double hotel
  totalMisc: number
  tierResults: TierResult[]
  numDays: number
}

// Staff overnight per day = (hotel_dbl + hotel_sgl) × vat ; halved unless staff_full
function staffOvernight(day: PricingDay, vat: number): number {
  const base = (Number(day.hotel_dbl) + Number(day.hotel_sgl)) * (1 + vat / 100)
  return day.staff_full ? base : base / 2
}

export function computePricing(m: PricingModel): PricingTotals {
  const days = m.days || []
  const numDays = days.length

  // Vehicle totals across all days
  const totalMini = numDays * (m.vehicle.mini || 0)
  const totalMidi = numDays * (m.vehicle.midi || 0)
  const totalBus = numDays * (m.vehicle.bus || 0)

  // Guide fee + staff overnight + shabbat/holiday across all days
  let totalGuideOvernight = 0
  let totalHotelDbl = 0
  let totalMisc = 0
  for (const d of days) {
    totalGuideOvernight += (Number(d.guide_fee) || 0)
    totalGuideOvernight += staffOvernight(d, m.vat_percent)
    totalGuideOvernight += (Number(d.shabbat_holiday) || 0)
    totalHotelDbl += (Number(d.hotel_dbl) || 0)
    totalMisc += (Number(d.misc) || 0)
  }

  const netBaseCost = totalHotelDbl + totalMisc  // per-person base (hotel + misc)

  const tierResults: TierResult[] = (m.tiers || []).map(pax => {
    if (!pax || pax <= 0) {
      return { pax, transportAlloc: 0, staffAlloc: 0, netBaseCost, totalNetBase: netBaseCost, totalPrice: netBaseCost }
    }
    // Transport allocation: ≤15 MINI, ≤30 MIDI, else BUS — divided by pax
    const transportTotal = pax <= 15 ? totalMini : pax <= 30 ? totalMidi : totalBus
    const transportAlloc = transportTotal / pax
    const staffAlloc = totalGuideOvernight / pax
    const totalNetBase = transportAlloc + staffAlloc + netBaseCost
    const totalPrice = totalNetBase * (1 + (m.margin_percent || 0) / 100)
    return { pax, transportAlloc, staffAlloc, netBaseCost, totalNetBase, totalPrice }
  })

  return { totalMini, totalMidi, totalBus, totalGuideOvernight, totalHotelDbl, totalMisc, tierResults, numDays }
}

// Single room total price for a tier (double price + single supplement portion)
export function singleRoomPrice(m: PricingModel, tier: TierResult): number {
  const totalSingleHotel = (m.days || []).reduce((s, d) => s + (Number(d.hotel_sgl) || 0), 0)
  // single pax pays the double base + the single supplement, with margin
  return (tier.totalNetBase + totalSingleHotel) * (1 + (m.margin_percent || 0) / 100)
}

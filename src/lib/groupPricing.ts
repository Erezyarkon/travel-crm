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
  tiers: number[]          // LOW bound of each pax tier (e.g. [14,20,25,30,35,40])
  tier_span: number        // size of each range (e.g. 5 -> 14-19, 20-24...)
  foc_hotel: number        // FOC where the hotel room is free (only entrances+meals spread)
  foc_full: number         // FOC where full cost (hotel+entrances+meals) spreads
  tier_note: string        // free-text note shown next to tiers in the quote
  days: PricingDay[]
}

export const DEFAULT_PRICING: PricingModel = {
  vehicle: { mini: 450, midi: 550, bus: 600 },
  guide_fee_per_day: 300,
  vat_percent: 18,
  margin_percent: 20,
  tiers: [14, 20, 25, 30, 35, 40],
  tier_span: 5,
  foc_hotel: 0,
  foc_full: 0,
  tier_note: '',
  days: [],
}

export interface TierResult {
  pax: number              // LOW bound (the number we divide by)
  paxHigh: number          // HIGH bound of the range (pax + span - 1)
  transportAlloc: number
  staffAlloc: number
  netBaseCost: number      // hotel + misc per person
  focAlloc: number         // FOC cost spread per paying person
  totalNetBase: number     // allocations + net base + foc
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

  const netBaseCost = totalHotelDbl + totalMisc  // per-person base (hotel + misc = hotel + entrances + meals)
  const span = m.tier_span && m.tier_span > 0 ? m.tier_span : 5
  const focHotel = Math.max(0, Number(m.foc_hotel) || 0)
  const focFull = Math.max(0, Number(m.foc_full) || 0)
  // FOC "hotel free": hotel room is free from the hotel, so only entrances+meals (misc) spread.
  // FOC "full": full per-person base (hotel + entrances + meals) spreads.
  // Vehicle and guide are NEVER part of FOC cost.
  const focCostTotal = (totalMisc * focHotel) + (netBaseCost * focFull)
  const focTotalCount = focHotel + focFull

  const tierResults: TierResult[] = (m.tiers || []).map(pax => {
    const paxHigh = pax + span - 1
    if (!pax || pax <= 0) {
      return { pax, paxHigh, transportAlloc: 0, staffAlloc: 0, netBaseCost, focAlloc: 0, totalNetBase: netBaseCost, totalPrice: netBaseCost }
    }
    // Paying pax = low bound minus the FOC (they don't pay). Divide everything by paying pax.
    const payingPax = Math.max(1, pax - focTotalCount)
    // Transport allocation: ≤15 MINI, ≤30 MIDI, else BUS — divided by paying pax
    const transportTotal = pax <= 15 ? totalMini : pax <= 30 ? totalMidi : totalBus
    const transportAlloc = transportTotal / payingPax
    const staffAlloc = totalGuideOvernight / payingPax
    // FOC cost spread across the paying pax
    const focAlloc = focCostTotal / payingPax
    const totalNetBase = transportAlloc + staffAlloc + netBaseCost + focAlloc
    const totalPrice = totalNetBase * (1 + (m.margin_percent || 0) / 100)
    return { pax, paxHigh, transportAlloc, staffAlloc, netBaseCost, focAlloc, totalNetBase, totalPrice }
  })

  return { totalMini, totalMidi, totalBus, totalGuideOvernight, totalHotelDbl, totalMisc, tierResults, numDays }
}

// Single room total price for a tier (double price + single supplement portion)
export function singleRoomPrice(m: PricingModel, tier: TierResult): number {
  const totalSingleHotel = (m.days || []).reduce((s, d) => s + (Number(d.hotel_sgl) || 0), 0)
  // single pax pays the double base + the single supplement, with margin
  return (tier.totalNetBase + totalSingleHotel) * (1 + (m.margin_percent || 0) / 100)
}

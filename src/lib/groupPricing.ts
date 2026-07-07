// Group pricing model — replicates the Excel "Group Pricing" sheet.

export interface PricingDay {
  date: string
  hotel: string
  board: string
  hotel_dbl: number       // hotel cost per person sharing double
  hotel_sgl: number       // single room portion (per person in single)
  meals: number           // meals cost per person (breakfast/lunch/dinner)
  entrances: number       // entrance fees per person
  guide_fee: number       // guide fee for the day (usually flat 300)
  shabbat_holiday: number // surcharge for Shabbat/holiday
  porterage: number       // porterage per person per day
  misc: number            // other misc costs
  staff: 'none' | 'half' | 'full'  // staff overnight rate
}

export interface PricingModel {
  vehicle: { mini: number; midi: number; bus: number }
  guide_fee_per_day: number
  vat_percent: number
  margin_percent: number
  tiers: number[]
  tier_span: number
  foc_hotel: number
  foc_full: number
  tier_note: string
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
  pax: number
  paxHigh: number
  transportAlloc: number
  staffAlloc: number
  netBaseCost: number
  focAlloc: number
  totalNetBase: number
  totalPrice: number
}

export interface PricingTotals {
  totalMini: number
  totalMidi: number
  totalBus: number
  totalGuideOvernight: number
  totalHotelDbl: number
  totalMeals: number
  totalEntrances: number
  totalPorterage: number
  totalMisc: number
  tierResults: TierResult[]
  numDays: number
}

// Staff overnight per day = (hotel_dbl + hotel_sgl) × vat; halved for 'half', full for 'full'
function staffOvernight(day: PricingDay, vat: number): number {
  const staff: string = (day.staff ?? ((day as any).staff_full ? 'full' : 'none'))
  if (staff === 'none') return 0
  const base = (Number(day.hotel_dbl) + Number(day.hotel_sgl)) * (1 + vat / 100)
  return staff === 'half' ? base / 2 : base
}

export function computePricing(m: PricingModel): PricingTotals {
  const days = m.days || []
  const numDays = days.length

  const totalMini = numDays * (m.vehicle.mini || 0)
  const totalMidi = numDays * (m.vehicle.midi || 0)
  const totalBus  = numDays * (m.vehicle.bus  || 0)

  let totalGuideOvernight = 0
  let totalHotelDbl       = 0
  let totalMeals          = 0
  let totalEntrances      = 0
  let totalPorterage      = 0
  let totalMisc           = 0

  for (const d of days) {
    totalGuideOvernight += (Number(d.guide_fee) || 0)
    totalGuideOvernight += staffOvernight(d, m.vat_percent)
    totalGuideOvernight += (Number(d.shabbat_holiday) || 0)
    totalHotelDbl       += (Number(d.hotel_dbl)  || 0)
    totalMeals          += (Number(d.meals)       || 0)
    totalEntrances      += (Number(d.entrances)   || 0)
    totalPorterage      += (Number(d.porterage)   || 0)
    totalMisc           += (Number(d.misc)        || 0)
    // legacy compat: old 'misc' used to include meals+entrances — skip if new fields present
  }

  // Per-person base = hotel + meals + entrances + misc
  const netBaseCost = totalHotelDbl + totalMeals + totalEntrances + totalPorterage + totalMisc
  const span        = m.tier_span && m.tier_span > 0 ? m.tier_span : 5
  const focHotel    = Math.max(0, Number(m.foc_hotel) || 0)
  const focFull     = Math.max(0, Number(m.foc_full)  || 0)

  // FOC hotel-free: only meals+entrances+porterage+misc spread
  const focMiscBase    = totalMeals + totalEntrances + totalPorterage + totalMisc
  const focCostTotal   = (focMiscBase * focHotel) + (netBaseCost * focFull)
  const focTotalCount  = focHotel + focFull

  const tierResults: TierResult[] = (m.tiers || []).map(pax => {
    const paxHigh    = pax + span - 1
    if (!pax || pax <= 0) return { pax, paxHigh, transportAlloc: 0, staffAlloc: 0, netBaseCost, focAlloc: 0, totalNetBase: netBaseCost, totalPrice: netBaseCost }
    const payingPax  = Math.max(1, pax - focTotalCount)
    const transportTotal = pax <= 15 ? totalMini : pax <= 30 ? totalMidi : totalBus
    const transportAlloc = transportTotal / payingPax
    const staffAlloc     = totalGuideOvernight / payingPax
    const focAlloc       = focCostTotal / payingPax
    const totalNetBase   = transportAlloc + staffAlloc + netBaseCost + focAlloc
    const totalPrice     = totalNetBase * (1 + (m.margin_percent || 0) / 100)
    return { pax, paxHigh, transportAlloc, staffAlloc, netBaseCost, focAlloc, totalNetBase, totalPrice }
  })

  return { totalMini, totalMidi, totalBus, totalGuideOvernight, totalHotelDbl, totalMeals, totalEntrances, totalPorterage, totalMisc, tierResults, numDays }
}

export function singleRoomPrice(m: PricingModel, tier: TierResult): number {
  const totalSingleHotel = (m.days || []).reduce((s, d) => s + (Number(d.hotel_sgl) || 0), 0)
  return (tier.totalNetBase + totalSingleHotel) * (1 + (m.margin_percent || 0) / 100)
}

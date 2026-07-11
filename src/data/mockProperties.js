// Pre-baked homeowner analysis payloads keyed by lowercased address.
// Any address not found here falls back to GENERIC_GOOD_SOLAR so the demo never dead-ends.

export const GOOD_SOLAR_1 = {
  address: '412 NW 8th Ave, Gainesville, FL',
  countyGeoid: '12001', // Alachua County, FL
  type: 'solar',
  systemSizeKw: 7.2,
  systemCost: 21600,
  systemCostAfterCredit: 15120,
  monthlySavings: 142,
  paybackYears: 8.9,
  twentyYearSavings: 34080,
  roofSuitability: 'excellent',
  aiSummary:
    "This home has a south-facing roof with almost no shade — a great match for solar. A 7.2kW system would cost about $15,120 after the federal tax credit, and it would pay for itself in under 9 years. After that, it's essentially free electricity: about $34,000 in savings over 20 years.",
}

export const GOOD_SOLAR_2 = {
  address: '2210 SW 34th St, Gainesville, FL',
  countyGeoid: '12001', // Alachua County, FL
  type: 'solar',
  systemSizeKw: 9.6,
  systemCost: 28800,
  systemCostAfterCredit: 20160,
  monthlySavings: 189,
  paybackYears: 8.9,
  twentyYearSavings: 45360,
  roofSuitability: 'excellent',
  aiSummary:
    "Your roof gets excellent sun exposure most of the day. A 9.6kW system sized to your usage would run about $20,160 after incentives, paying itself off in roughly 9 years and saving you around $45,000 over two decades.",
}

export const GOOD_SOLAR_3 = {
  address: '1305 NE 16th Ave, Gainesville, FL',
  countyGeoid: '12001', // Alachua County, FL
  type: 'solar',
  systemSizeKw: 6.0,
  systemCost: 18000,
  systemCostAfterCredit: 12600,
  monthlySavings: 108,
  paybackYears: 9.7,
  twentyYearSavings: 25920,
  roofSuitability: 'good',
  aiSummary:
    "This roof has good solar potential with minor afternoon shading from a nearby tree. A 6kW system would cost about $12,600 after the tax credit, paying back in under 10 years and saving roughly $25,900 over 20 years.",
}

export const POOR_ROOF = {
  address: '78 SE 2nd Pl, Gainesville, FL',
  countyGeoid: '12001', // Alachua County, FL
  type: 'alternative',
  reason: 'poor_roof',
  roofSuitability: 'poor',
  communitySolarSavingsMo: 34,
  communitySolarSavingsYr: 408,
  aiSummary:
    "Your roof faces mostly north with significant shading, so rooftop solar wouldn't pay off here — the system would take too long to break even. The good news: you can still go solar without a roof. Community solar lets you subscribe to a share of a local solar farm and see the savings directly on your electric bill, no installation required.",
}

export const RENTER = {
  address: '900 W University Ave Apt 4B, Gainesville, FL',
  countyGeoid: '12001', // Alachua County, FL
  type: 'alternative',
  reason: 'renter',
  aiSummary:
    "Since you're renting, rooftop solar isn't an option — but you don't need to own a roof to benefit from clean energy. Community solar subscriptions let you buy into a shared solar farm and get a credit on your monthly electric bill, typically 10-15% cheaper than your current rate, with no equipment and no long-term commitment.",
  communitySolarSavingsMo: 22,
  communitySolarSavingsYr: 264,
}

export const GENERIC_GOOD_SOLAR = {
  address: 'Your address',
  countyGeoid: '12001', // Alachua County, FL — demo footprint is centered on Gainesville
  type: 'solar',
  systemSizeKw: 7.5,
  systemCost: 22500,
  systemCostAfterCredit: 15750,
  monthlySavings: 135,
  paybackYears: 9.4,
  twentyYearSavings: 32400,
  roofSuitability: 'good',
  aiSummary:
    "Based on typical conditions in your area, a 7.5kW rooftop system would cost about $15,750 after the federal tax credit. That pays for itself in roughly 9-10 years, and over 20 years you'd save around $32,400 on electricity.",
}

export const MOCK_ADDRESS_MAP = {
  '412 nw 8th ave, gainesville, fl': GOOD_SOLAR_1,
  '2210 sw 34th st, gainesville, fl': GOOD_SOLAR_2,
  '1305 ne 16th ave, gainesville, fl': GOOD_SOLAR_3,
  '78 se 2nd pl, gainesville, fl': POOR_ROOF,
  '900 w university ave apt 4b, gainesville, fl': RENTER,
}

export const ADDRESS_SUGGESTIONS = [
  '412 NW 8th Ave, Gainesville, FL',
  '2210 SW 34th St, Gainesville, FL',
  '1305 NE 16th Ave, Gainesville, FL',
  '78 SE 2nd Pl, Gainesville, FL',
  '900 W University Ave Apt 4B, Gainesville, FL',
]

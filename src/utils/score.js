// opportunityScore = normalize(savings) - normalize(adoption) + normalize(burden), scaled 0-100:
// tracts with high potential savings, low existing solar adoption, and high energy burden score highest (best lending opportunity).
const SAVINGS_MAX = 220 // $/mo, realistic ceiling for the region
const ADOPTION_MAX = 40 // % of households with solar
const BURDEN_MAX = 12 // % of income spent on energy

function normalize(value, max) {
  return Math.max(0, Math.min(1, value / max))
}

export function computeOpportunityScore({ savings, adoption, burden }) {
  const savingsNorm = normalize(savings, SAVINGS_MAX)
  const adoptionNorm = normalize(adoption, ADOPTION_MAX)
  const burdenNorm = normalize(burden, BURDEN_MAX)

  const raw = savingsNorm - adoptionNorm + burdenNorm // range roughly -1..2
  const scaled = ((raw + 1) / 3) * 100

  return Math.round(Math.max(0, Math.min(100, scaled)))
}

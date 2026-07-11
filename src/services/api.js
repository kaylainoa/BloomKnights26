import countiesGeojson from '../data/counties.geojson?raw'
import countyCensusStats from '../data/countyCensusStats.json'
import { computeOpportunityScore } from '../utils/score'
import {
  MOCK_ADDRESS_MAP,
  GENERIC_GOOD_SOLAR,
} from '../data/mockProperties'

const MOCK_DELAY_MS = 600

function delay(ms = MOCK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const GOOGLE_API_KEY = import.meta.env.GOOGLE_API_KEY

// Google's blended residential electricity rate assumption ($/kWh) used when the
// Solar API's own cost-of-electricity figure isn't available.
const FALLBACK_RATE_PER_KWH = 0.14

async function geocodeAddress(address) {
  // Places API (New) — this key is restricted to Solar + Places, so the legacy
  // Geocoding endpoint is deliberately not used here.
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.location,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery: address }),
  })
  if (!res.ok) throw new Error(`Places API ${res.status}`)
  const data = await res.json()
  const place = data.places?.[0]
  if (!place) throw new Error('No place found for address')
  return { lat: place.location.latitude, lng: place.location.longitude }
}

async function fetchBuildingInsights({ lat, lng }) {
  const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Solar API ${res.status}`)
  return res.json()
}

function analysisFromBuildingInsights(insights, address) {
  const potential = insights.solarPotential
  if (!potential) throw new Error('No solar potential data')

  // Pick the financial analysis closest to a typical $150/mo bill.
  const analyses = potential.financialAnalyses || []
  const best = analyses.reduce((closest, a) => {
    const bill = Number(a.monthlyBill?.units ?? 0)
    if (!closest) return a
    return Math.abs(bill - 150) < Math.abs(Number(closest.monthlyBill?.units ?? 0) - 150) ? a : closest
  }, null)

  const roofSquareFeet = (potential.wholeRoofStats?.areaMeters2 || 0) * 10.764
  const maxPanels = potential.maxArrayPanelsCount || 0
  const panelWatts = potential.panelCapacityWatts || 400
  const systemSizeKw = Math.round(((maxPanels * panelWatts) / 1000) * 10) / 10

  const cash = best?.cashPurchaseSavings
  const systemCost = cash?.outOfPocketCost?.units ? Number(cash.outOfPocketCost.units) : systemSizeKw * 3000
  const systemCostAfterCredit = Math.round(systemCost * 0.7)
  const monthlySavings = cash?.savings?.savingsYear1?.units
    ? Math.round(Number(cash.savings.savingsYear1.units) / 12)
    : Math.round((systemSizeKw * 1400 * FALLBACK_RATE_PER_KWH) / 12)
  const twentyYearSavings = cash?.savings?.savingsLifetime?.units
    ? Math.round(Number(cash.savings.savingsLifetime.units))
    : monthlySavings * 12 * 20
  const paybackYears = cash?.paybackYears ?? Math.round((systemCostAfterCredit / (monthlySavings * 12)) * 10) / 10

  const sunshineHours = potential.maxSunshineHoursPerYear || 0
  const roofSuitability = sunshineHours > 1400 ? 'excellent' : sunshineHours > 900 ? 'good' : 'poor'

  if (roofSuitability === 'poor' || systemSizeKw < 2) {
    return {
      address,
      type: 'alternative',
      reason: 'poor_roof',
      roofSuitability,
      communitySolarSavingsMo: 30,
      communitySolarSavingsYr: 360,
      aiSummary:
        "This roof doesn't get enough consistent sun for rooftop solar to pay off, but community solar can still get you clean-energy savings with no installation.",
    }
  }

  return {
    address,
    type: 'solar',
    systemSizeKw,
    systemCost,
    systemCostAfterCredit,
    monthlySavings,
    paybackYears,
    twentyYearSavings,
    roofSuitability,
    roofSquareFeet: Math.round(roofSquareFeet),
    aiSummary: `A ${systemSizeKw}kW system on this roof would cost about $${systemCostAfterCredit.toLocaleString()} after the federal tax credit, paying back in roughly ${paybackYears} years and saving around $${twentyYearSavings.toLocaleString()} over 20 years.`,
  }
}

/**
 * getPropertyAnalysis(address)
 * ----------------------------
 * REAL API: Google Places API (New) `places:searchText` to geocode the address, then
 *   Google Solar API `buildingInsights:findClosest`
 *   GET https://solar.googleapis.com/v1/buildingInsights:findClosest
 *       ?location.latitude={lat}&location.longitude={lng}&key={API_KEY}
 * Response shape used: solarPotential.maxArrayPanelsCount, solarPotential.wholeRoofStats,
 *   solarPotential.financialAnalyses[].cashPurchaseSavings, maxSunshineHoursPerYear.
 * NOTE: the Solar API requires billing to be enabled on the Google Cloud project, and
 *   Places API (New) must be enabled for the key — until then this call fails and the
 *   function falls back to the mock dataset below, so the demo never breaks.
 */
export async function getPropertyAnalysis(address) {
  const key = address.trim().toLowerCase()

  if (GOOGLE_API_KEY) {
    try {
      const location = await geocodeAddress(address)
      const insights = await fetchBuildingInsights(location)
      return analysisFromBuildingInsights(insights, address)
    } catch (err) {
      console.warn('[SolarScope] Google Solar API unavailable, using mock data:', err.message)
    }
  }

  await delay()

  const match = MOCK_ADDRESS_MAP[key]
  if (match) {
    return { ...match, address }
  }

  // Unrecognized address never dead-ends — fall back to a generic good-solar result.
  return { ...GENERIC_GOOD_SOLAR, address }
}

const CENSUS_API_KEY = import.meta.env.CENSUS_API_KEY
const EIA_API_KEY = import.meta.env.EIA_API_KEY
const NREL_API_KEY = import.meta.env.NREL_API_KEY

const STATE_FIPS_BY_POSTAL = { FL: '12', GA: '13' }
const COVERED_STATES = Object.keys(STATE_FIPS_BY_POSTAL)
const BASELINE_MONTHLY_KWH = 1150 // typical FL/GA residential usage, incl. AC load
const SOLAR_OFFSET_FRACTION = 0.75 // share of the bill a typically-sized rooftop system offsets

// US Census ACS 5-year: median household income (B19013_001E), population (B01003_001E),
// and total households (B11001_001E) for every county in one state, in one call.
async function fetchCountyCensusStats(stateFips) {
  const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,B19013_001E,B01003_001E,B11001_001E&for=county:*&in=state:${stateFips}&key=${CENSUS_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Census API ${res.status}`)
  const [header, ...rows] = await res.json()
  const idx = Object.fromEntries(header.map((h, i) => [h, i]))
  const byGeoid = {}
  rows.forEach((row) => {
    const geoid = row[idx.state] + row[idx.county]
    byGeoid[geoid] = {
      medianIncome: Number(row[idx.B19013_001E]),
      population: Number(row[idx.B01003_001E]),
      households: Number(row[idx.B11001_001E]),
    }
  })
  return byGeoid
}

// EIA API v2: most recent statewide residential retail electricity price (EIA doesn't
// publish county-level retail rates, so every county within a state shares this one figure).
async function fetchStateElectricityRate(statePostal) {
  const url =
    'https://api.eia.gov/v2/electricity/retail-sales/data/?frequency=monthly&data[0]=price' +
    `&facets[stateid][]=${statePostal}&facets[sectorid][]=RES&sort[0][column]=period&sort[0][direction]=desc&length=1&api_key=${EIA_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`EIA API ${res.status}`)
  const json = await res.json()
  const centsPerKwh = Number(json.response?.data?.[0]?.price)
  if (!centsPerKwh) throw new Error('EIA API returned no price')
  return centsPerKwh / 100
}

// NREL Solar Resource Data: average annual GHI (kWh/m²/day) at a county's centroid —
// this is what actually varies solar production across the state (panhandle vs. south FL).
async function fetchCountySolarResource(lat, lng) {
  const url = `https://developer.nrel.gov/api/solar/solar_resource/v1.json?lat=${lat}&lon=${lng}&api_key=${NREL_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`NREL API ${res.status}`)
  const json = await res.json()
  return json.outputs?.avg_ghi?.annual ?? null
}

// Annual GHI genuinely declines with latitude across this footprint — the FL peninsula/Keys
// (~24.5°N) run noticeably sunnier than north Georgia (~35°N). Used whenever NREL is
// unreachable, so savings still reflects the real geographic solar gradient instead of
// collapsing to one flat figure.
function estimateGhiFromLatitude(lat) {
  return Math.max(4.5, Math.min(5.6, 5.6 - (lat - 24.5) * 0.105))
}

function countyCentroid(feature) {
  const rings =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates[0]]
      : feature.geometry.coordinates.map((part) => part[0])
  let sumLng = 0
  let sumLat = 0
  let count = 0
  rings.forEach((ring) =>
    ring.forEach(([lng, lat]) => {
      sumLng += lng
      sumLat += lat
      count += 1
    })
  )
  return { lat: sumLat / count, lng: sumLng / count }
}

// No free live API publishes per-county rooftop solar adoption rates, so adoption is modeled
// from income + population density: higher-income, denser counties tend to have more existing
// solar (upfront cost + installer availability), which suppresses their score relative to
// lower-adoption counties with comparable savings/burden.
function estimateAdoptionPct({ medianIncome, population, landAreaSqmi }) {
  const densityPerSqmi = population / landAreaSqmi
  const raw = 3 + (medianIncome / 100000) * 9 + Math.log10(densityPerSqmi + 1) * 5
  return Math.round(Math.max(1, Math.min(35, raw)))
}

// Census's data API sends no CORS headers, so it can never be called directly from a browser —
// this static snapshot (real 2022 median household income + 2023 population estimates per FL and
// GA county, sourced from USDA ERS's county-level datasets, which republish the same underlying
// Census/BEA figures) stands in whenever the live fetchCountyCensusStats() call fails, which in
// practice is always from a browser. household_count is derived from population using a typical
// Southeast US household size (~2.5 people), not a directly-sourced figure.
function staticCensusStats(geoid) {
  return countyCensusStats[geoid] ?? null
}

async function safely(fn, label) {
  try {
    return await fn()
  } catch (err) {
    console.warn(`[SolarScope] ${label} unavailable, using estimate:`, err.message)
    return null
  }
}

function buildCountyFeature(feature, { census, ratePerKwh, ghi, avgGhi }) {
  const { GEOID, name, land_area_sqmi: landAreaSqmi } = feature.properties

  const stats = census ?? staticCensusStats(GEOID)
  const medianIncome = stats.medianIncome
  const population = stats.population
  const households = stats.households ?? Math.round(population / 2.5)

  const estimatedMonthlyBill = BASELINE_MONTHLY_KWH * ratePerKwh
  const solarResourceFactor = ghi / avgGhi
  const avgSavingsMo = Math.round(estimatedMonthlyBill * SOLAR_OFFSET_FRACTION * solarResourceFactor)
  const energyBurdenPct = Math.round(((estimatedMonthlyBill * 12) / medianIncome) * 1000) / 10
  const adoptionPct = estimateAdoptionPct({ medianIncome, population, landAreaSqmi })

  // Ranking key only — score.js's absolute SAVINGS_MAX/ADOPTION_MAX/BURDEN_MAX constants were
  // calibrated against the old single-county mock data. Real FL/GA county figures have much
  // tighter variance (savings/burden never approach those ceilings), so this raw value is used
  // purely to sort counties relative to each other; see rankCountiesByOpportunity below for the
  // displayed opportunity_score.
  const rankingScore = computeOpportunityScore({
    savings: avgSavingsMo,
    adoption: adoptionPct,
    burden: energyBurdenPct,
  })

  return {
    ...feature,
    properties: {
      GEOID,
      name,
      _rankingScore: rankingScore,
      avg_savings_mo: avgSavingsMo,
      adoption_pct: adoptionPct,
      energy_burden_pct: energyBurdenPct,
      household_count: households,
    },
  }
}

// Displays each county's opportunity as a percentile rank among the currently-loaded set rather
// than an absolute score against a fixed ceiling — real FL/GA inputs are too tightly clustered
// for the fixed thresholds to ever produce the full red/amber/green/sage spread otherwise (every
// county landed in one middle band). Percentile rank guarantees the color scale is always used
// meaningfully, and matches what a lender actually wants: which counties are the best relative
// opportunities right now, not whether they clear some arbitrary global number.
function rankCountiesByOpportunity(features) {
  const ranked = [...features].sort((a, b) => a.properties._rankingScore - b.properties._rankingScore)
  const count = ranked.length
  return ranked.map((feature, i) => {
    const { _rankingScore, ...properties } = feature.properties
    return {
      ...feature,
      properties: {
        ...properties,
        opportunity_score: Math.round(((i + 1) / count) * 100),
      },
    }
  })
}

/**
 * getTractScores()
 * ----------------
 * REAL API: US Census ACS (median household income, population, households) for every FL and GA
 *   county (one call per state), EIA API v2 for each state's current residential electricity
 *   rate, and NREL Solar Resource Data per county centroid for solar production variance across
 *   both states. Adoption is a modeled heuristic (see estimateAdoptionPct) since no free live API
 *   publishes per-county solar adoption. Each county's inputs feed utils/score.js
 *   computeOpportunityScore() as a ranking key, then rankCountiesByOpportunity() converts that
 *   into a percentile-rank opportunity_score (see its comment for why) to produce a GeoJSON
 *   FeatureCollection covering all of Florida and Georgia (COVERED_STATES).
 * NOTE: the Census data API does not send CORS headers, so it cannot be called directly from a
 *   browser regardless of key validity — that source always falls back to the real static
 *   snapshot in data/countyCensusStats.json (see staticCensusStats) unless a server-side proxy
 *   is added. EIA and NREL do support direct browser calls and are used live whenever their keys
 *   work; each source fails independently so one outage never blanks out the other two.
 */
export async function getTractScores() {
  const counties = JSON.parse(countiesGeojson).features

  const [censusResults, rateResults] = await Promise.all([
    CENSUS_API_KEY
      ? Promise.all(
          COVERED_STATES.map((postal) =>
            safely(() => fetchCountyCensusStats(STATE_FIPS_BY_POSTAL[postal]), `Census API (${postal})`)
          )
        )
      : Promise.resolve([]),
    EIA_API_KEY
      ? Promise.all(
          COVERED_STATES.map((postal) => safely(() => fetchStateElectricityRate(postal), `EIA API (${postal})`))
        )
      : Promise.resolve([]),
  ])
  const censusByGeoid = Object.assign({}, ...censusResults.filter(Boolean))
  const rateByState = Object.fromEntries(
    COVERED_STATES.map((postal, i) => [postal, rateResults[i]]).filter(([, rate]) => rate)
  )

  const centroidByGeoid = {}
  counties.forEach((feature) => {
    centroidByGeoid[feature.properties.GEOID] = countyCentroid(feature)
  })

  const liveGhiByGeoid = {}
  if (NREL_API_KEY) {
    await Promise.all(
      counties.map(async (feature) => {
        const geoid = feature.properties.GEOID
        const { lat, lng } = centroidByGeoid[geoid]
        liveGhiByGeoid[geoid] = await safely(() => fetchCountySolarResource(lat, lng), `NREL API (${geoid})`)
      })
    )
  }

  // Every county gets an effective GHI — live from NREL where it succeeded, otherwise the
  // latitude-based estimate — so solar-driven savings always varies geographically instead of
  // collapsing to one flat number when NREL is unreachable.
  const effectiveGhiByGeoid = {}
  counties.forEach((feature) => {
    const geoid = feature.properties.GEOID
    effectiveGhiByGeoid[geoid] = liveGhiByGeoid[geoid] ?? estimateGhiFromLatitude(centroidByGeoid[geoid].lat)
  })
  const ghiValues = Object.values(effectiveGhiByGeoid)
  const avgGhi = ghiValues.reduce((sum, v) => sum + v, 0) / ghiValues.length

  await delay(200)

  const features = counties.map((feature) =>
    buildCountyFeature(feature, {
      census: censusByGeoid[feature.properties.GEOID] ?? null,
      ratePerKwh: rateByState[feature.properties.state] ?? FALLBACK_RATE_PER_KWH,
      ghi: effectiveGhiByGeoid[feature.properties.GEOID],
      avgGhi,
    })
  )

  return { type: 'FeatureCollection', features: rankCountiesByOpportunity(features) }
}

const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-flash-latest'

function buildSummaryPrompt(analysis) {
  if (analysis.type === 'alternative') {
    return (
      `Write a 2-3 sentence, plain-English, encouraging summary for a homeowner at ${analysis.address}. ` +
      `Rooftop solar isn't a good fit for them (reason: ${analysis.reason === 'renter' ? 'they rent, no roof to install on' : 'poor roof sun exposure'}). ` +
      `Instead, recommend community solar, which would save them about $${analysis.communitySolarSavingsMo}/mo ` +
      `(~$${analysis.communitySolarSavingsYr}/yr). Keep it warm and solution-oriented, no dead-end tone.`
    )
  }
  return (
    `Write a 2-3 sentence, plain-English summary for a homeowner at ${analysis.address} considering rooftop solar. ` +
    `A ${analysis.systemSizeKw}kW system would cost $${analysis.systemCostAfterCredit} after the federal tax credit, ` +
    `save about $${analysis.monthlySavings}/month, pay back in ${analysis.paybackYears} years, and save roughly ` +
    `$${analysis.twentyYearSavings} over 20 years. Roof suitability: ${analysis.roofSuitability}. ` +
    `Write for a non-technical reader, no bullet points, no headers.`
  )
}

/**
 * generateSummary(analysis)
 * --------------------------
 * REAL API: Google Gemini API — generateContent
 *   POST https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent
 *       ?key={API_KEY}
 * Request body: { contents: [{ parts: [{ text: prompt }] }] } where prompt includes the
 *   numeric analysis (system cost, savings, payback) and asks for a 2-3 sentence plain-English
 *   summary aimed at a non-technical homeowner.
 * Response shape used: candidates[0].content.parts[0].text
 * Falls back to the pre-written `aiSummary` on the mock/derived analysis object if the
 * Gemini call fails or no key is configured, so the UI never shows an empty summary box.
 */
export async function generateSummary(analysis) {
  if (GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildSummaryPrompt(analysis) }] }],
          }),
        }
      )
      if (!res.ok) throw new Error(`Gemini API ${res.status}`)
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      if (text) return text
    } catch (err) {
      console.warn('[SolarScope] Gemini API unavailable, using canned summary:', err.message)
    }
  }

  await delay(400)
  return analysis.aiSummary
}

// OneEthos solar-loan terms used to fake an instant financing decision.
const ONEETHOS_APR = 0.0699 // 6.99% fixed
const ONEETHOS_TERM_MONTHS = 240 // 20-year solar loan

// Standard fixed-rate amortization: monthly payment on `principal` at `apr`
// over `months`.
function amortizedMonthlyPayment(principal, apr, months) {
  const r = apr / 12
  if (r === 0) return Math.round(principal / months)
  const payment = (principal * r) / (1 - Math.pow(1 + r, -months))
  return Math.round(payment)
}

/**
 * referToLender(tractIdOrAddress, { amount })
 * -------------------------------------------
 * REAL API: OneEthos financing referral + instant pre-qualification endpoint
 *   (partner-provided stub for the hackathon).
 *   POST https://api.oneethos.com/v1/referrals
 *   Request: { source: 'solarscope', tractId | address, amount, contactEmail, timestamp }
 *   Response: { referralId, status, decision, approvedAmount, apr, termMonths, monthlyPayment }
 * Swap point: replace the body of this function with the real POST call once OneEthos
 *   provides sandbox credentials; components only care about the resolved shape below.
 *
 * FAKE: always approves, and derives a monthly payment by amortizing the requested
 *   `amount` (defaults to a typical $18k solar loan) over OneEthos' standard terms.
 */
export async function referToLender(tractIdOrAddress, { amount } = {}) {
  await delay(2000)

  const approvedAmount = Math.round(amount && amount > 0 ? amount : 18000)
  const monthlyPayment = amortizedMonthlyPayment(
    approvedAmount,
    ONEETHOS_APR,
    ONEETHOS_TERM_MONTHS
  )

  return {
    success: true,
    referralId: `REF-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
    target: tractIdOrAddress,
    status: 'received',
    decision: 'approved',
    approvedAmount,
    apr: ONEETHOS_APR,
    termMonths: ONEETHOS_TERM_MONTHS,
    monthlyPayment,
  }
}

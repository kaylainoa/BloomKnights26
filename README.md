# SolarScope

A two-sided clean energy platform: a homeowner-facing solar savings estimator and a
lender-facing opportunity heat map of census tracts in Alachua County, FL.

## Setup

```bash
npm install
npm run dev
```

Open the printed local URL (e.g. `http://localhost:5173`). The app is fully demoable
with mock data out of the box — no API keys required.

### Mapbox token (optional)

The lender view renders a live Mapbox choropleth if a token is present, and gracefully
falls back to an inline SVG choropleth if it isn't.

1. Copy `.env.example` to `.env`.
2. Set `VITE_MAPBOX_TOKEN=your_token_here` (get a free token at https://account.mapbox.com/).
3. Restart `npm run dev`.

### Sponsor API keys (optional)

`getPropertyAnalysis` and `generateSummary` call real APIs directly from the browser if
keys are present in `.env` (see `.env.example`), and fall back to mock data automatically
on any failure — so the app never breaks even with missing/misconfigured keys:

```
GOOGLE_API_KEY=...   # Places API (New) + Solar API — for geocoding + roof/panel analysis
GEMINI_API_KEY=...   # Gemini generateContent — for the AI summary text
NREL_API_KEY=...     # reserved for the getTractScores() swap (not yet wired)
EIA_API_KEY=...      # reserved for the getTractScores() swap (not yet wired)
CENSUS_API_KEY=...   # reserved for the getTractScores() swap (not yet wired)
```

These are read via a custom `envPrefix` in `vite.config.js` (not the usual `VITE_`
prefix), since that's how they were provided. **Note:** because this app has no backend,
any key here gets bundled into the shipped JS and is visible to anyone inspecting the
site — restrict these keys (HTTP referrer / API restrictions in Google Cloud Console)
and rotate them after the hackathon.

As of this writing, `GOOGLE_API_KEY` needs two things enabled in Google Cloud Console
before the real calls succeed (until then, `getPropertyAnalysis` silently falls back to
the mock addresses): **Places API (New)** enabled, and **billing enabled** on the project
(the Solar API requires it). `generateSummary` works out of the box with `gemini-flash-latest`.

## Architecture

All data flows through `src/services/api.js` — the single seam between components and
data. Every function there is async with an artificial ~600ms delay (so loading states
are real) and returns mock data shaped exactly like the real API response it stands in
for. Swapping a mock for a real API means changing the body of one function; no
component needs to know or care whether data is mocked.

- `src/data/mockProperties.js` — 5 pre-baked homeowner addresses (3 good-solar, 1
  poor-roof, 1 renter). Unrecognized addresses fall back to a generic good-solar result.
- `src/data/tracts.geojson` — 14 mock census tracts around Gainesville, FL with
  opportunity scores computed by `src/utils/score.js`.
- `src/utils/score.js` — `computeOpportunityScore({ savings, adoption, burden })`:
  `normalize(savings) - normalize(adoption) + normalize(burden)`, scaled 0-100. High
  savings potential + low existing adoption + high energy burden = high opportunity.
- `src/utils/csv.js` — client-side CSV export for the lender shortlist.
- `src/components/homeowner/Hero.jsx` — the landing hero shown before a search happens,
  with an inline SVG solar-house illustration and the centered address search.

## Real-API swap points

Each is a single function body in `src/services/api.js`:

| Function | Replace with | Docs |
|---|---|---|
| `getPropertyAnalysis(address)` | Geocode the address, then call Google Solar API `buildingInsights:findClosest` for roof/panel potential; combine with EIA retail rates for $ savings | [Google Solar API](https://developers.google.com/maps/documentation/solar/overview) |
| `getTractScores()` | Join Census ACS tract demographics (income, energy burden) with EIA API v2 retail electricity rates and solar adoption data, run each tract through `computeOpportunityScore()` | [EIA API v2](https://www.eia.gov/opendata/), [Census ACS](https://www.census.gov/data/developers/data-sets/acs-5year.html) |
| `generateSummary(analysis)` | Google Gemini API `generateContent`, prompted with the numeric analysis to produce a plain-English summary | [Gemini API](https://ai.google.dev/gemini-api/docs) |
| `referToLender(target)` | POST to the OneEthos referral endpoint once sandbox credentials are available | (partner-provided, hackathon stub) |

Full request/response shapes and exact endpoints are documented as comment blocks above
each function in `src/services/api.js`.

## Stack

Vite + React, Tailwind CSS, Mapbox GL JS (with SVG fallback), lucide-react icons.

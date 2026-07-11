export function downloadTractsCsv(tracts, filename = 'solarscope-shortlist.csv') {
  const headers = [
    'GEOID',
    'Name',
    'Opportunity Score',
    'Avg Monthly Savings',
    'Solar Adoption %',
    'Energy Burden %',
    'Households',
  ]

  const rows = tracts.map((t) => [
    t.GEOID,
    t.name,
    t.opportunity_score,
    t.avg_savings_mo,
    t.adoption_pct,
    t.energy_burden_pct,
    t.household_count,
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

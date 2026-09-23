import { api } from './api.js'

/**
 * Shared helper — builds query params object, dropping undefined values.
 */
function params({ facilityId, from, to } = {}) {
  const p = {}
  if (facilityId) p.facilityId = facilityId
  if (from) p.from = from instanceof Date ? from.toISOString() : from
  if (to) p.to = to instanceof Date ? to.toISOString() : to
  return p
}

/**
 * Monthly CO2e trend data for the LineChart.
 * Returns: [{ month: '2026-01', co2e: 1234.56 }, ...]
 *
 * @param {{ facilityId?, from?, to? }} filters
 */
export async function fetchTrend(filters = {}) {
  const res = await api.get('/reports/trend', { params: params(filters) })
  return res.data.data
}

/**
 * CO2e by GHG scope for the PieChart.
 * Returns: [{ scope: 'Scope 1', co2e: 500 }, ...]
 *
 * @param {{ facilityId?, from?, to? }} filters
 */
export async function fetchByScope(filters = {}) {
  const res = await api.get('/reports/by-scope', { params: params(filters) })
  return res.data.data
}

/**
 * CO2e by emission type for the BarChart.
 * Returns: [{ type: 'electricity', co2e: 800 }, ...]
 *
 * @param {{ facilityId?, from?, to? }} filters
 */
export async function fetchByType(filters = {}) {
  const res = await api.get('/reports/by-type', { params: params(filters) })
  return res.data.data
}

/**
 * CO2e by facility, sorted descending, for the horizontal BarChart.
 * Returns: [{ facilityId, facilityName, co2e }, ...]
 *
 * @param {{ from?, to? }} filters  (facilityId filter not applicable here)
 */
export async function fetchByFacility(filters = {}) {
  const res = await api.get('/reports/by-facility', { params: params(filters) })
  return res.data.data
}

/**
 * Summary stats for the dashboard stat cards.
 * Returns: { totalCO2e, recordCount, avgCO2ePerRecord, prevPeriodCO2e, pctChange }
 *
 * pctChange is null when there is no previous-period data to compare against.
 *
 * @param {{ facilityId?, from?, to? }} filters
 */
export async function fetchSummary(filters = {}) {
  const res = await api.get('/reports/summary', { params: params(filters) })
  return res.data.data
}

/**
 * Convenience: fetch all 5 datasets in parallel.
 * Useful for the initial dashboard load.
 *
 * @param {{ facilityId?, from?, to? }} filters
 * @returns {{ trend, byScope, byType, byFacility, summary }}
 */
export async function fetchDashboardData(filters = {}) {
  const [trend, byScope, byType, byFacility, summary] = await Promise.all([
    fetchTrend(filters),
    fetchByScope(filters),
    fetchByType(filters),
    fetchByFacility(filters),
    fetchSummary(filters),
  ])
  return { trend, byScope, byType, byFacility, summary }
}

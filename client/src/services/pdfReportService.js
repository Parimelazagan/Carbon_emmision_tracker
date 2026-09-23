import { api } from './api.js'

/**
 * Request a new PDF report to be generated server-side.
 *
 * @param {{ periodStart: string, periodEnd: string, facilityId?: string }} params
 *   periodStart / periodEnd — ISO date strings (YYYY-MM-DD)
 * @returns {Promise<{ report: { _id, filePath, periodStart, periodEnd, createdAt } }>}
 */
export async function generateReport({ periodStart, periodEnd, facilityId } = {}) {
  const body = { periodStart, periodEnd }
  if (facilityId) body.facilityId = facilityId
  const res = await api.post('/reports/generate', body)
  return res.data.data
}

/**
 * List all generated PDF reports for the authenticated user's org.
 *
 * @param {{ page?, limit? }} params
 * @returns {Promise<{ reports, pagination }>}
 */
export async function listReports(params = {}) {
  const res = await api.get('/reports/list', { params })
  return res.data.data
}

/**
 * Download a previously generated PDF report.
 * Returns a Blob URL you can assign to an <a> tag and click() to trigger download.
 *
 * @param {string} reportId
 * @param {string} [filename]  suggested download filename
 * @returns {Promise<string>}  object URL (remember to URL.revokeObjectURL after use)
 */
export async function downloadReport(reportId, filename = 'carbon-report.pdf') {
  const res = await api.get(`/reports/download/${reportId}`, { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))

  // Trigger browser download automatically
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  return url
}

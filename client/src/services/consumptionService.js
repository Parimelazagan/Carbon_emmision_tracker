import { api } from './api.js'

/**
 * Create a manual consumption record.
 *
 * @param {{ facilityId, date, type, amount, unit, region }} data
 * @returns {Promise<{ record }>}
 */
export async function createConsumptionRecord(data) {
  const res = await api.post('/consumption', data)
  return res.data.data
}

/**
 * List consumption records for the authenticated user's org.
 *
 * @param {{ facilityId?, type?, from?, to?, page?, limit? }} params
 * @returns {Promise<{ records, pagination }>}
 */
export async function listConsumptionRecords(params = {}) {
  const res = await api.get('/consumption', { params })
  return res.data.data
}

/**
 * Get a single consumption record by ID.
 *
 * @param {string} id
 * @returns {Promise<{ record }>}
 */
export async function getConsumptionRecord(id) {
  const res = await api.get(`/consumption/${id}`)
  return res.data.data
}

/**
 * Update a consumption record by ID.
 *
 * @param {string} id
 * @param {{ date?, type?, amount?, unit?, region? }} data
 * @returns {Promise<{ record }>}
 */
export async function updateConsumptionRecord(id, data) {
  const res = await api.patch(`/consumption/${id}`, data)
  return res.data.data
}

/**
 * Verify a consumption record by ID (Admin only).
 *
 * @param {string} id
 * @param {'verified' | 'estimated' | 'unverified'} verificationStatus
 * @returns {Promise<{ record }>}
 */
export async function verifyConsumptionRecord(id, verificationStatus) {
  const res = await api.patch(`/consumption/${id}/verify`, { verificationStatus })
  return res.data.data
}

/**
 * Delete a consumption record by ID. Admin only.
 *
 * @param {string} id
 * @returns {Promise<{ message }>}
 */
export async function deleteConsumptionRecord(id) {
  const res = await api.delete(`/consumption/${id}`)
  return res.data.data
}

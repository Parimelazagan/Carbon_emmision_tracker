import { api } from './api.js'

/**
 * Upload a CSV or Excel file for bulk consumption import.
 * The file is sent as multipart/form-data under the field name "file".
 *
 * @param {File} file        - browser File object
 * @param {Function} [onProgress] - optional upload progress callback (0-100)
 * @returns {Promise<{ batch, importedCount, rejectedCount, rejectedDetails }>}
 */
export async function uploadConsumptionFile(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => {
          const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0
          onProgress(pct)
        }
      : undefined,
  })

  return res.data.data
}

/**
 * List all upload batches for the authenticated user's org.
 *
 * @param {{ page?, limit? }} params
 * @returns {Promise<{ batches, pagination }>}
 */
export async function listUploadBatches(params = {}) {
  const res = await api.get('/upload/batches', { params })
  return res.data.data
}

/**
 * Get a single upload batch with full rejected-row details.
 *
 * @param {string} id
 * @returns {Promise<{ batch }>}
 */
export async function getUploadBatch(id) {
  const res = await api.get(`/upload/batches/${id}`)
  return res.data.data
}

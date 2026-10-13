import { parse } from 'csv-parse/sync'
import ExcelJS from 'exceljs'
import Joi from 'joi'
import { calculateEmissions } from './emissionsCalculator.js'

const EMISSION_TYPES = ['electricity', 'diesel', 'petrol', 'natural_gas', 'water']

// Expected columns — must match the post-normalised key names
const REQUIRED_COLUMNS = ['date', 'facilityId', 'type', 'amount', 'unit', 'region']

const rowSchema = Joi.object({
  date: Joi.date().iso().max('now').required().messages({
    'date.base': 'date must be a valid ISO date (YYYY-MM-DD)',
    'date.max': 'date cannot be in the future',
    'any.required': 'date is required',
  }),
  facilityId: Joi.string().trim().min(1).required().messages({
    'any.required': 'facilityId is required',
  }),
  type: Joi.string().valid(...EMISSION_TYPES).required().messages({
    'any.only': `type must be one of: ${EMISSION_TYPES.join(', ')}`,
    'any.required': 'type is required',
  }),
  amount: Joi.number().positive().required().messages({
    'number.base': 'amount must be a number',
    'number.positive': 'amount must be positive',
    'any.required': 'amount is required',
  }),
  unit: Joi.string().trim().min(1).required().messages({
    'any.required': 'unit is required',
  }),
  region: Joi.string().trim().min(1).required().messages({
    'any.required': 'region is required',
  }),
})

/**
 * Normalise a raw header string to a camelCase key we work with internally.
 */
function normaliseHeader(h) {
  const s = String(h).trim().toLowerCase().replace(/[\s_-]+/g, '')
  if (s === 'facilityid') return 'facilityId'
  return s
}

/**
 * Convert a raw row object (headers as-is) into a normalised object.
 */
function normaliseRow(raw) {
  const out = {}
  for (const [k, v] of Object.entries(raw)) {
    out[normaliseHeader(k)] = typeof v === 'string' ? v.trim() : v
  }
  return out
}

/**
 * Parse a CSV buffer and return an array of raw row objects.
 */
function parseCSV(buffer) {
  return parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })
}

/**
 * Parse an Excel buffer and return an array of raw row objects.
 * Uses the first worksheet.
 */
async function parseExcel(buffer) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.worksheets[0]
  if (!sheet) return []

  const rows = []
  let headers = []

  sheet.eachRow((row, rowNumber) => {
    const values = row.values.slice(1) // ExcelJS rows are 1-indexed, index 0 is empty
    if (rowNumber === 1) {
      headers = values.map((v) => String(v ?? '').trim())
    } else {
      const obj = {}
      headers.forEach((h, i) => {
        const cell = values[i]
        // Unwrap ExcelJS rich-text / date objects
        if (cell instanceof Date) {
          obj[h] = cell.toISOString().split('T')[0]
        } else if (cell && typeof cell === 'object' && cell.text !== undefined) {
          obj[h] = cell.text
        } else {
          obj[h] = cell ?? ''
        }
      })
      rows.push(obj)
    }
  })

  return rows
}

/**
 * Main entry point.
 * Parses the file, validates each row, attempts emissions calculation.
 *
 * @param {Buffer} buffer
 * @param {'csv'|'excel'} fileType
 * @returns {{ valid: Array, rejected: Array }}
 *   valid   — [{ rowNumber, data: { facility, date, type, amount, unit, co2e, scope } }]
 *   rejected — [{ rowNumber, reasons: string[] }]
 */
export async function parseUpload(buffer, fileType) {
  const rawRows = fileType === 'csv' ? parseCSV(buffer) : await parseExcel(buffer)

  const valid = []
  const rejected = []

  for (let i = 0; i < rawRows.length; i++) {
    const rowNumber = i + 2 // +2: 1-indexed + header row
    const normalised = normaliseRow(rawRows[i])

    // Check required columns present
    const missingCols = REQUIRED_COLUMNS.filter((c) => !(c in normalised))
    if (missingCols.length > 0) {
      rejected.push({ rowNumber, reasons: [`Missing columns: ${missingCols.join(', ')}`] })
      continue
    }

    const { error, value } = rowSchema.validate(normalised, { abortEarly: false, convert: true })
    if (error) {
      rejected.push({ rowNumber, reasons: error.details.map((d) => d.message) })
      continue
    }

    // Emissions calculation — reject row if no matching factor
    let co2e, scope
    try {
      ;({ co2e, scope } = await calculateEmissions(value.type, value.amount, value.unit, value.region))
    } catch (calcErr) {
      rejected.push({ rowNumber, reasons: [calcErr.message] })
      continue
    }

    valid.push({
      rowNumber,
      data: {
        facility: value.facilityId,
        date: value.date,
        type: value.type,
        amount: value.amount,
        unit: value.unit,
        region: value.region,
        calculatedCO2e: co2e,
        scope,
      },
    })
  }

  return { valid, rejected, totalRows: rawRows.length }
}

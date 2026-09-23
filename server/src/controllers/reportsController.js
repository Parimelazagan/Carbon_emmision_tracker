import path from 'path'
import fs from 'fs'
import Joi from 'joi'
import {
  emissionsTrend,
  emissionsByScope,
  emissionsByType,
  emissionsByFacility,
  summaryStats,
} from '../services/reportAggregations.js'
import { generatePDF } from '../services/pdfReportGenerator.js'
import Report from '../models/Report.js'
import Organization from '../models/Organization.js'
import User from '../models/User.js'

const querySchema = Joi.object({
  facilityId: Joi.string().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().min(Joi.ref('from')).optional(),
})

const generateSchema = Joi.object({
  periodStart: Joi.date().iso().required(),
  periodEnd: Joi.date().iso().min(Joi.ref('periodStart')).required(),
  facilityId: Joi.string().optional(),
})

function parseQuery(req, res) {
  const { error, value } = querySchema.validate(req.query, { abortEarly: false })
  if (error) {
    res.status(400).json({
      success: false,
      data: null,
      error: { message: 'Invalid query params', details: error.details.map((d) => d.message) },
    })
    return null
  }
  return { ...value, orgId: req.user.org }
}

// ── Aggregation endpoints ─────────────────────────────────────────────────────

export async function trend(req, res, next) {
  try {
    const params = parseQuery(req, res)
    if (!params) return
    const data = await emissionsTrend(params)
    return res.json({ success: true, data, error: null })
  } catch (err) { next(err) }
}

export async function byScope(req, res, next) {
  try {
    const params = parseQuery(req, res)
    if (!params) return
    const data = await emissionsByScope(params)
    return res.json({ success: true, data, error: null })
  } catch (err) { next(err) }
}

export async function byType(req, res, next) {
  try {
    const params = parseQuery(req, res)
    if (!params) return
    const data = await emissionsByType(params)
    return res.json({ success: true, data, error: null })
  } catch (err) { next(err) }
}

export async function byFacility(req, res, next) {
  try {
    const params = parseQuery(req, res)
    if (!params) return
    const data = await emissionsByFacility(params)
    return res.json({ success: true, data, error: null })
  } catch (err) { next(err) }
}

export async function summary(req, res, next) {
  try {
    const params = parseQuery(req, res)
    if (!params) return
    const data = await summaryStats(params)
    return res.json({ success: true, data, error: null })
  } catch (err) { next(err) }
}

// ── PDF generation ────────────────────────────────────────────────────────────

/**
 * POST /api/reports/generate
 * Runs all aggregations, builds a PDF, saves to disk, logs a Report document.
 * Roles: admin, data_entry
 */
export async function generateReport(req, res, next) {
  try {
    const { error, value } = generateSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false, data: null,
        error: { message: 'Validation failed', details: error.details.map((d) => d.message) },
      })
    }

    const { periodStart, periodEnd, facilityId } = value
    const orgId = req.user.org
    const filters = { orgId, facilityId, from: periodStart, to: periodEnd }

    // Fetch all data in parallel
    const [trendData, byScopeData, byTypeData, byFacilityData, statsData, org, user] =
      await Promise.all([
        emissionsTrend(filters),
        emissionsByScope(filters),
        emissionsByType(filters),
        emissionsByFacility(filters),
        summaryStats(filters),
        Organization.findById(orgId),
        User.findById(req.user.sub),
      ])

    // Resolve storage path
    const reportsDir = path.resolve(process.env.REPORTS_DIR || 'storage/reports')
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true })

    const fileName = `report-${orgId}-${Date.now()}.pdf`
    const filePath = path.join(reportsDir, fileName)

    await generatePDF(
      {
        orgName: org?.name ?? 'Unknown Organization',
        periodStart,
        periodEnd,
        generatedBy: user?.name ?? 'Unknown',
        trend: trendData,
        byScope: byScopeData,
        byType: byTypeData,
        byFacility: byFacilityData,
        totalCO2e: statsData.totalCO2e,
        recordCount: statsData.recordCount,
      },
      filePath,
    )

    // Persist report record
    const report = await Report.create({
      organization: orgId,
      generatedBy: req.user.sub,
      periodStart,
      periodEnd,
      filePath: path.join(process.env.REPORTS_DIR || 'storage/reports', fileName),
    })

    return res.status(201).json({ success: true, data: { report }, error: null })
  } catch (err) { next(err) }
}

/**
 * GET /api/reports/list?page=&limit=
 * Lists generated PDF reports for the org.
 */
export async function listReports(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const skip = (page - 1) * limit

    const filter = { organization: req.user.org }
    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('generatedBy', 'name email'),
      Report.countDocuments(filter),
    ])

    return res.json({
      success: true,
      data: { reports, pagination: { total, page, limit, pages: Math.ceil(total / limit) } },
      error: null,
    })
  } catch (err) { next(err) }
}

/**
 * GET /api/reports/download/:id
 * Streams the PDF file to the client.
 */
export async function downloadReport(req, res, next) {
  try {
    const report = await Report.findById(req.params.id)
    if (!report) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Report not found' } })
    }

    // Org ownership check
    if (report.organization.toString() !== req.user.org.toString()) {
      return res.status(403).json({ success: false, data: null, error: { message: 'Forbidden' } })
    }

    const filePath = path.resolve(report.filePath)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, data: null, error: { message: 'PDF file not found on server' } })
    }

    const fileName = path.basename(filePath)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    fs.createReadStream(filePath).pipe(res)
  } catch (err) { next(err) }
}

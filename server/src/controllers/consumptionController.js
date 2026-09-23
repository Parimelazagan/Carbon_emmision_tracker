import Joi from 'joi'
import ConsumptionRecord from '../models/ConsumptionRecord.js'
import { calculateEmissions } from '../services/emissionsCalculator.js'

const EMISSION_TYPES = ['electricity', 'diesel', 'petrol', 'natural_gas', 'water']

const createSchema = Joi.object({
  facilityId: Joi.string().required(),
  date: Joi.date().iso().max('now').required(),
  type: Joi.string().valid(...EMISSION_TYPES).required(),
  amount: Joi.number().positive().required(),
  unit: Joi.string().trim().min(1).required(),
  region: Joi.string().trim().min(1).required(),
})

const listSchema = Joi.object({
  facilityId: Joi.string(),
  type: Joi.string().valid(...EMISSION_TYPES),
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref('from')),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
})

/**
 * POST /api/consumption
 * Creates a consumption record, auto-calculating CO2e and scope.
 * Roles: admin, data_entry
 */
export async function createConsumption(req, res, next) {
  try {
    const { error, value } = createSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { message: 'Validation failed', details: error.details.map((d) => d.message) },
      })
    }

    const { facilityId, date, type, amount, unit, region } = value

    // Calculate CO2e — throws 422 if no matching EmissionFactor
    const { co2e, scope } = await calculateEmissions(type, amount, unit, region)

    const record = await ConsumptionRecord.create({
      facility: facilityId,
      date,
      type,
      amount,
      unit,
      calculatedCO2e: co2e,
      scope,
      enteredBy: req.user.sub,
      source: 'manual',
    })

    const populated = await record.populate([
      { path: 'facility', select: 'name location' },
      { path: 'enteredBy', select: 'name email' },
    ])

    return res.status(201).json({ success: true, data: { record: populated }, error: null })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/consumption
 * Paginated list scoped to the user's organization.
 * Query params: facilityId, type, from, to, page, limit
 */
export async function listConsumption(req, res, next) {
  try {
    const { error, value } = listSchema.validate(req.query, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { message: 'Invalid query params', details: error.details.map((d) => d.message) },
      })
    }

    const { facilityId, type, from, to, page, limit } = value

    // Build match — always scoped to org via facility lookup
    const matchFacility = { organization: req.user.org }
    if (facilityId) matchFacility._id = facilityId

    // Get facility IDs belonging to this org
    const Facility = (await import('../models/Facility.js')).default
    const orgFacilities = await Facility.find(matchFacility, '_id')
    const facilityIds = orgFacilities.map((f) => f._id)

    const filter = { facility: { $in: facilityIds } }
    if (type) filter.type = type
    if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = from
      if (to) filter.date.$lte = to
    }

    const skip = (page - 1) * limit
    const [records, total] = await Promise.all([
      ConsumptionRecord.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('facility', 'name location')
        .populate('enteredBy', 'name email'),
      ConsumptionRecord.countDocuments(filter),
    ])

    return res.json({
      success: true,
      data: {
        records,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
      error: null,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/consumption/:id
 */
export async function getConsumption(req, res, next) {
  try {
    const record = await ConsumptionRecord.findById(req.params.id)
      .populate('facility', 'name location organization')
      .populate('enteredBy', 'name email')

    if (!record) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Record not found' } })
    }

    // Scope check — facility must belong to user's org
    if (record.facility.organization.toString() !== req.user.org.toString()) {
      return res.status(403).json({ success: false, data: null, error: { message: 'Forbidden' } })
    }

    return res.json({ success: true, data: { record }, error: null })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/consumption/:id
 * Admin only.
 */
export async function deleteConsumption(req, res, next) {
  try {
    const record = await ConsumptionRecord.findById(req.params.id)
      .populate('facility', 'organization')

    if (!record) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Record not found' } })
    }

    if (record.facility.organization.toString() !== req.user.org.toString()) {
      return res.status(403).json({ success: false, data: null, error: { message: 'Forbidden' } })
    }

    await record.deleteOne()
    return res.json({ success: true, data: { message: 'Record deleted' }, error: null })
  } catch (err) {
    next(err)
  }
}

import Joi from 'joi'
import ConsumptionRecord from '../models/ConsumptionRecord.js'
import Facility from '../models/Facility.js'
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

const updateSchema = Joi.object({
  date: Joi.date().iso().max('now'),
  type: Joi.string().valid(...EMISSION_TYPES),
  amount: Joi.number().positive(),
  unit: Joi.string().trim().min(1),
  region: Joi.string().trim().min(1),
}).min(1) // at least one field required

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
 */
export async function createConsumption(req, res, next) {
  try {
    const { error, value } = createSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false, data: null,
        error: { message: 'Validation failed', details: error.details.map((d) => d.message) },
      })
    }

    const { facilityId, date, type, amount, unit, region } = value
    const { co2e, scope } = await calculateEmissions(type, amount, unit, region)

    const record = await ConsumptionRecord.create({
      facility: facilityId,
      date, type, amount, unit, region,
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
 */
export async function listConsumption(req, res, next) {
  try {
    const { error, value } = listSchema.validate(req.query, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false, data: null,
        error: { message: 'Invalid query params', details: error.details.map((d) => d.message) },
      })
    }

    const { facilityId, type, from, to, page, limit } = value

    const matchFacility = { organization: req.user.org }
    if (facilityId) matchFacility._id = facilityId

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
      data: { records, pagination: { total, page, limit, pages: Math.ceil(total / limit) } },
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

    if (record.facility.organization.toString() !== req.user.org.toString()) {
      return res.status(403).json({ success: false, data: null, error: { message: 'Forbidden' } })
    }

    return res.json({ success: true, data: { record }, error: null })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/consumption/:id
 * Recalculates CO2e if type/amount/unit/region change.
 * Roles: admin, data_entry
 */
export async function updateConsumption(req, res, next) {
  try {
    const { error, value } = updateSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false, data: null,
        error: { message: 'Validation failed', details: error.details.map((d) => d.message) },
      })
    }

    const record = await ConsumptionRecord.findById(req.params.id)
      .populate('facility', 'organization')

    if (!record) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Record not found' } })
    }

    if (record.facility.organization.toString() !== req.user.org.toString()) {
      return res.status(403).json({ success: false, data: null, error: { message: 'Forbidden' } })
    }

    // Apply field updates
    if (value.date)   record.date   = value.date
    if (value.type)   record.type   = value.type
    if (value.amount) record.amount = value.amount
    if (value.unit)   record.unit   = value.unit
    if (value.region) record.region = value.region

    // Recalculate CO2e whenever any emissions-affecting field changes
    const needsRecalc = value.type || value.amount || value.unit || value.region
    if (needsRecalc) {
      const { co2e, scope } = await calculateEmissions(
        record.type,
        record.amount,
        record.unit,
        record.region,
      )
      record.calculatedCO2e = co2e
      record.scope = scope
    }

    await record.save()

    const populated = await record.populate([
      { path: 'facility', select: 'name location' },
      { path: 'enteredBy', select: 'name email' },
    ])

    return res.json({ success: true, data: { record: populated }, error: null })
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

const verifySchema = Joi.object({
  status: Joi.string().valid('verified', 'estimated', 'unverified').required(),
})

/**
 * PATCH /api/consumption/:id/verify
 * Admin only. Sets verificationStatus and, when status is "verified",
 * records verifiedBy + verifiedAt. Clears both if status moves away from "verified".
 */
export async function verifyConsumption(req, res, next) {
  try {
    const { error, value } = verifySchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false, data: null,
        error: { message: 'Validation failed', details: error.details.map((d) => d.message) },
      })
    }

    const record = await ConsumptionRecord.findById(req.params.id)
      .populate('facility', 'organization')

    if (!record) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Record not found' } })
    }

    if (record.facility.organization.toString() !== req.user.org.toString()) {
      return res.status(403).json({ success: false, data: null, error: { message: 'Forbidden' } })
    }

    record.verificationStatus = value.status

    if (value.status === 'verified') {
      record.verifiedBy = req.user.sub
      record.verifiedAt = new Date()
    } else {
      // Moving away from verified — clear audit fields
      record.verifiedBy = undefined
      record.verifiedAt = undefined
    }

    await record.save()

    const populated = await record.populate([
      { path: 'facility', select: 'name location' },
      { path: 'enteredBy', select: 'name email' },
      { path: 'verifiedBy', select: 'name email' },
    ])

    return res.json({ success: true, data: { record: populated }, error: null })
  } catch (err) {
    next(err)
  }
}

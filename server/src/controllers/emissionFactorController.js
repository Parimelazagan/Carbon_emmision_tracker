import Joi from 'joi'
import EmissionFactor from '../models/EmissionFactor.js'

const EMISSION_TYPES = ['electricity', 'diesel', 'petrol', 'natural_gas', 'water']

const factorSchema = Joi.object({
  type: Joi.string().valid(...EMISSION_TYPES).required(),
  region: Joi.string().trim().min(1).max(100).required(),
  factorValue: Joi.number().positive().required(),
  unit: Joi.string().trim().min(1).max(20).required(),
})

/**
 * GET /api/emission-factors
 * All roles. Supports optional ?type= and ?region= filters.
 */
export async function listFactors(req, res, next) {
  try {
    const filter = {}
    if (req.query.type) filter.type = req.query.type
    if (req.query.region) filter.region = req.query.region

    const factors = await EmissionFactor.find(filter).sort({ type: 1, region: 1 })
    return res.json({ success: true, data: { factors }, error: null })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/emission-factors/:id
 * All roles.
 */
export async function getFactor(req, res, next) {
  try {
    const factor = await EmissionFactor.findById(req.params.id)
    if (!factor) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Emission factor not found' } })
    }
    return res.json({ success: true, data: { factor }, error: null })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/emission-factors
 * Admin only.
 */
export async function createFactor(req, res, next) {
  try {
    const { error, value } = factorSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false, data: null,
        error: { message: 'Validation failed', details: error.details.map((d) => d.message) },
      })
    }

    const existing = await EmissionFactor.findOne({ type: value.type, region: value.region, unit: value.unit })
    if (existing) {
      return res.status(409).json({
        success: false, data: null,
        error: { message: `An emission factor for type="${value.type}", region="${value.region}", unit="${value.unit}" already exists` },
      })
    }

    const factor = await EmissionFactor.create(value)
    return res.status(201).json({ success: true, data: { factor }, error: null })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/emission-factors/:id
 * Admin only. Only factorValue can be updated (changing type/region/unit would
 * invalidate existing consumption records that used this factor).
 */
export async function updateFactor(req, res, next) {
  try {
    const { error, value } = Joi.object({
      factorValue: Joi.number().positive().required(),
    }).validate(req.body, { abortEarly: false })

    if (error) {
      return res.status(400).json({
        success: false, data: null,
        error: { message: 'Validation failed', details: error.details.map((d) => d.message) },
      })
    }

    const factor = await EmissionFactor.findById(req.params.id)
    if (!factor) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Emission factor not found' } })
    }

    factor.factorValue = value.factorValue
    await factor.save()

    return res.json({ success: true, data: { factor }, error: null })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/emission-factors/:id
 * Admin only.
 */
export async function deleteFactor(req, res, next) {
  try {
    const factor = await EmissionFactor.findById(req.params.id)
    if (!factor) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Emission factor not found' } })
    }

    await factor.deleteOne()
    return res.json({ success: true, data: { message: 'Emission factor deleted' }, error: null })
  } catch (err) {
    next(err)
  }
}

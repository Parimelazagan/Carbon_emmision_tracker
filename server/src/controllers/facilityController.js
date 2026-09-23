import Joi from 'joi'
import Facility from '../models/Facility.js'
import ConsumptionRecord from '../models/ConsumptionRecord.js'

const facilitySchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  location: Joi.string().trim().max(300).allow('').default(''),
})

/**
 * GET /api/facilities
 * Lists all facilities for the authenticated user's organization.
 */
export async function listFacilities(req, res, next) {
  try {
    const facilities = await Facility.find({ organization: req.user.org }).sort({ name: 1 })
    return res.json({ success: true, data: { facilities }, error: null })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/facilities
 * Admin / data_entry only.
 */
export async function createFacility(req, res, next) {
  try {
    const { error, value } = facilitySchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false, data: null,
        error: { message: 'Validation failed', details: error.details.map((d) => d.message) },
      })
    }

    const facility = await Facility.create({ ...value, organization: req.user.org })
    return res.status(201).json({ success: true, data: { facility }, error: null })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/facilities/:id
 * Admin / data_entry only.
 */
export async function updateFacility(req, res, next) {
  try {
    const { error, value } = facilitySchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false, data: null,
        error: { message: 'Validation failed', details: error.details.map((d) => d.message) },
      })
    }

    const facility = await Facility.findOne({ _id: req.params.id, organization: req.user.org })
    if (!facility) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Facility not found' } })
    }

    facility.name = value.name
    facility.location = value.location
    await facility.save()

    return res.json({ success: true, data: { facility }, error: null })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/facilities/:id
 * Admin only. Blocked if the facility has consumption records.
 */
export async function deleteFacility(req, res, next) {
  try {
    const facility = await Facility.findOne({ _id: req.params.id, organization: req.user.org })
    if (!facility) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Facility not found' } })
    }

    // Application-level integrity check — no cascade delete in MongoDB
    const recordCount = await ConsumptionRecord.countDocuments({ facility: facility._id })
    if (recordCount > 0) {
      return res.status(409).json({
        success: false, data: null,
        error: { message: `Cannot delete: facility has ${recordCount} consumption record(s). Remove them first.` },
      })
    }

    await facility.deleteOne()
    return res.json({ success: true, data: { message: 'Facility deleted' }, error: null })
  } catch (err) {
    next(err)
  }
}

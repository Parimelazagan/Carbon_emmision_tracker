import Joi from 'joi'
import Organization from '../models/Organization.js'

const updateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
})

/**
 * GET /api/organizations/:id
 * Any authenticated member of the org can view it.
 */
export async function getOrganization(req, res, next) {
  try {
    const org = await Organization.findById(req.params.id)
    if (!org) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Organization not found' } })
    }

    // Users can only see their own org
    if (org._id.toString() !== req.user.org.toString()) {
      return res.status(403).json({ success: false, data: null, error: { message: 'Forbidden' } })
    }

    return res.json({ success: true, data: { organization: org }, error: null })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/organizations/:id
 * Only admins can rename their org.
 */
export async function updateOrganization(req, res, next) {
  try {
    const { error, value } = updateSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false, data: null,
        error: { message: 'Validation failed', details: error.details.map((d) => d.message) },
      })
    }

    const org = await Organization.findById(req.params.id)
    if (!org) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Organization not found' } })
    }

    if (org._id.toString() !== req.user.org.toString()) {
      return res.status(403).json({ success: false, data: null, error: { message: 'Forbidden' } })
    }

    org.name = value.name
    await org.save()

    return res.json({ success: true, data: { organization: org }, error: null })
  } catch (err) {
    next(err)
  }
}

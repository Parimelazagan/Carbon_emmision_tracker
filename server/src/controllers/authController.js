import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Joi from 'joi'
import User from '../models/User.js'
import Organization from '../models/Organization.js'

const SALT_ROUNDS = 12

// ── Validation schemas ────────────────────────────────────────────────────────

const signupSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
  organizationName: Joi.string().trim().min(1).max(200).required(),
  role: Joi.string().valid('admin', 'data_entry', 'viewer').default('viewer'),
})

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function issueToken(user) {
  return jwt.sign(
    { sub: user._id, role: user.role, org: user.organization },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  )
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/signup
 * Creates a new Organization and the first User (admin) in one shot.
 */
export async function signup(req, res, next) {
  try {
    const { error, value } = signupSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          message: 'Validation failed',
          details: error.details.map((d) => d.message),
        },
      })
    }

    const { name, email, password, organizationName, role } = value

    // Reject duplicate emails
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({
        success: false,
        data: null,
        error: { message: 'Email already in use' },
      })
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    // Create org first, then user — both reference each other conceptually
    const org = await Organization.create({ name: organizationName })
    const user = await User.create({ name, email, passwordHash, role, organization: org._id })

    const token = issueToken(user)

    return res.status(201).json({
      success: true,
      data: { token, user },
      error: null,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          message: 'Validation failed',
          details: error.details.map((d) => d.message),
        },
      })
    }

    const { email, password } = value

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { message: 'Invalid email or password' },
      })
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { message: 'Invalid email or password' },
      })
    }

    const token = issueToken(user)

    return res.json({
      success: true,
      data: { token, user },
      error: null,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/me — returns the authenticated user's profile
 */
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.sub).populate('organization', 'name')
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { message: 'User not found' },
      })
    }
    return res.json({ success: true, data: { user }, error: null })
  } catch (err) {
    next(err)
  }
}

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Joi from 'joi'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import Invite from '../models/Invite.js'
import mongoose from 'mongoose'

const SALT_ROUNDS = 12

// ── Validation schemas ────────────────────────────────────────────────────────

const signupSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
  organizationName: Joi.string().trim().min(1).max(200).required(),
  role: Joi.string().valid('admin', 'data_entry', 'viewer').default('admin'),
})

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
})

const inviteSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  role: Joi.string().valid('admin', 'data_entry', 'viewer').default('viewer'),
})

const acceptInviteSchema = Joi.object({
  token: Joi.string().required(),
  name: Joi.string().trim().min(1).max(100).required(),
  password: Joi.string().min(8).required(),
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
 * Creates a new Organization and the first User (admin) using a transaction
 * so an orphan org is never left behind if user creation fails.
 */
export async function signup(req, res, next) {
  const session = await mongoose.startSession()
  try {
    const { error, value } = signupSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { message: 'Validation failed', details: error.details.map((d) => d.message) },
      })
    }

    const { name, email, password, organizationName, role } = value

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({
        success: false,
        data: null,
        error: { message: 'Email already in use' },
      })
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    let org, user
    await session.withTransaction(async () => {
      ;[org] = await Organization.create([{ name: organizationName }], { session })
      ;[user] = await User.create([{ name, email, passwordHash, role, organization: org._id }], { session })
    })

    const token = issueToken(user)
    return res.status(201).json({ success: true, data: { token, user }, error: null })
  } catch (err) {
    next(err)
  } finally {
    session.endSession()
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
        error: { message: 'Validation failed', details: error.details.map((d) => d.message) },
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
    return res.json({ success: true, data: { token, user }, error: null })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/me
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

/**
 * POST /api/auth/invite
 * Admin only. Creates a signed invite token for an email address and returns it.
 * In production you would email this token; here it is returned in the response
 * so the frontend can display or forward it.
 */
export async function invite(req, res, next) {
  try {
    const { error, value } = inviteSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { message: 'Validation failed', details: error.details.map((d) => d.message) },
      })
    }

    const { email, role } = value

    // Prevent inviting someone who is already a member
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        data: null,
        error: { message: 'A user with this email already exists' },
      })
    }

    // Invalidate any previous pending invite for this email + org
    await Invite.deleteMany({ email, organization: req.user.org })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const inviteDoc = await Invite.create({
      email,
      role,
      organization: req.user.org,
      invitedBy: req.user.sub,
      token,
      expiresAt,
    })

    return res.status(201).json({
      success: true,
      data: {
        invite: {
          email: inviteDoc.email,
          role: inviteDoc.role,
          expiresAt: inviteDoc.expiresAt,
          token, // return token so frontend can share the accept link
        },
      },
      error: null,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/accept-invite
 * Public. Accepts an invite token, creates the user, and returns a JWT.
 */
export async function acceptInvite(req, res, next) {
  try {
    const { error, value } = acceptInviteSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { message: 'Validation failed', details: error.details.map((d) => d.message) },
      })
    }

    const { token, name, password } = value

    const inviteDoc = await Invite.findOne({ token })
    if (!inviteDoc) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { message: 'Invalid or expired invite token' },
      })
    }

    if (inviteDoc.expiresAt < new Date()) {
      await inviteDoc.deleteOne()
      return res.status(400).json({
        success: false,
        data: null,
        error: { message: 'Invite token has expired' },
      })
    }

    // Double-check email not already taken
    const existing = await User.findOne({ email: inviteDoc.email })
    if (existing) {
      return res.status(409).json({
        success: false,
        data: null,
        error: { message: 'An account with this email already exists' },
      })
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const user = await User.create({
      name,
      email: inviteDoc.email,
      passwordHash,
      role: inviteDoc.role,
      organization: inviteDoc.organization,
    })

    // Consume the invite — single use
    await inviteDoc.deleteOne()

    const jwtToken = issueToken(user)
    return res.status(201).json({ success: true, data: { token: jwtToken, user }, error: null })
  } catch (err) {
    next(err)
  }
}

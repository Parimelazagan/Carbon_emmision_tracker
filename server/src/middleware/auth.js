import jwt from 'jsonwebtoken'

/**
 * requireAuth — verifies the JWT from the Authorization header.
 * On success, attaches the decoded payload to req.user.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: null,
      error: { message: 'Authentication required' },
    })
  }

  const token = header.slice(7)

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    return res.status(401).json({
      success: false,
      data: null,
      error: { message },
    })
  }
}

/**
 * requireRole(...roles) — gate a route to specific roles.
 * Must be used after requireAuth so req.user is already populated.
 *
 * @example  router.delete('/:id', requireAuth, requireRole('admin'), controller)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: { message: 'Insufficient permissions' },
      })
    }
    next()
  }
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500
  const message = status === 500 ? 'Internal server error' : err.message

  // Always log full error for diagnostics
  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`)

  res.status(status).json({
    success: false,
    data: null,
    error: {
      message,
      // Expose real error detail in non-production so bugs are visible
      ...(process.env.NODE_ENV !== 'production' && status === 500 ? { detail: err.message } : {}),
      ...(err.details ? { details: err.details } : {}),
    },
  })
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500
  const message = status === 500 ? 'Internal server error' : err.message

  if (process.env.NODE_ENV !== 'production') {
    console.error(err)
  }

  res.status(status).json({
    success: false,
    data: null,
    error: {
      message,
      ...(err.details ? { details: err.details } : {}),
    },
  })
}

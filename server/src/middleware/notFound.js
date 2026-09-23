export function notFound(req, res) {
  res.status(404).json({
    success: false,
    data: null,
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  })
}

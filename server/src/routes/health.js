import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', service: 'carbon-tracker-api' },
    error: null,
  })
})

export default router

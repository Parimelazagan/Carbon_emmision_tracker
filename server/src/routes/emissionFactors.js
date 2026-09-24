import { Router } from 'express'
import {
  listFactors,
  getFactor,
  createFactor,
  updateFactor,
  deleteFactor,
} from '../controllers/emissionFactorController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

// All authenticated roles can read
router.get('/',    requireAuth, listFactors)
router.get('/:id', requireAuth, getFactor)

// Admin only for mutations
router.post('/',    requireAuth, requireRole('admin'), createFactor)
router.patch('/:id', requireAuth, requireRole('admin'), updateFactor)
router.delete('/:id', requireAuth, requireRole('admin'), deleteFactor)

export default router

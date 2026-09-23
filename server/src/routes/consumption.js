import { Router } from 'express'
import {
  createConsumption,
  listConsumption,
  getConsumption,
  deleteConsumption,
} from '../controllers/consumptionController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, listConsumption)
router.post('/', requireAuth, requireRole('admin', 'data_entry'), createConsumption)
router.get('/:id', requireAuth, getConsumption)
router.delete('/:id', requireAuth, requireRole('admin'), deleteConsumption)

export default router

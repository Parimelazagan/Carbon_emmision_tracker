import { Router } from 'express'
import {
  listFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
} from '../controllers/facilityController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, listFacilities)
router.post('/', requireAuth, requireRole('admin', 'data_entry'), createFacility)
router.patch('/:id', requireAuth, requireRole('admin', 'data_entry'), updateFacility)
router.delete('/:id', requireAuth, requireRole('admin'), deleteFacility)

export default router

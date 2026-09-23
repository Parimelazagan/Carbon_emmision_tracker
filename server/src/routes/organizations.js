import { Router } from 'express'
import { getOrganization, updateOrganization } from '../controllers/organizationController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/:id', requireAuth, getOrganization)
router.patch('/:id', requireAuth, requireRole('admin'), updateOrganization)

export default router

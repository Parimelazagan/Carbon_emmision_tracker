import { Router } from 'express'
import { signup, login, getMe, invite, acceptInvite } from '../controllers/authController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.post('/signup', signup)
router.post('/login', login)
router.get('/me', requireAuth, getMe)
router.post('/invite', requireAuth, requireRole('admin'), invite)
router.post('/accept-invite', acceptInvite)

export default router

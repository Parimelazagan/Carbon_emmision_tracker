import { Router } from 'express'
import {
  trend,
  byScope,
  byType,
  byFacility,
  summary,
  generateReport,
  listReports,
  downloadReport,
  deleteReport,
} from '../controllers/reportsController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

// ── Aggregation (all authenticated roles) ────────────────────────────────────
router.get('/trend',        requireAuth, trend)
router.get('/by-scope',     requireAuth, byScope)
router.get('/by-type',      requireAuth, byType)
router.get('/by-facility',  requireAuth, byFacility)
router.get('/summary',      requireAuth, summary)

// ── PDF generation & download ─────────────────────────────────────────────────
router.post('/generate',      requireAuth, requireRole('admin', 'data_entry'), generateReport)
router.get('/list',           requireAuth, listReports)
router.get('/download/:id',   requireAuth, downloadReport)
router.delete('/:id',         requireAuth, requireRole('admin'), deleteReport)

export default router

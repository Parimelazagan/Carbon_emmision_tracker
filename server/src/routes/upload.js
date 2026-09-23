import { Router } from 'express'
import { uploadFile, listBatches, getBatch } from '../controllers/uploadController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import multer from 'multer'

// Store file in memory — we parse the buffer directly, no disk writes needed
const storage = multer.memoryStorage()

const fileFilter = (_req, file, cb) => {
  const allowed = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]
  if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
    cb(null, true)
  } else {
    cb(new Error('Only CSV and Excel files are accepted'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
})

const router = Router()

router.post(
  '/',
  requireAuth,
  requireRole('admin', 'data_entry'),
  upload.single('file'),
  uploadFile,
)
router.get('/batches', requireAuth, listBatches)
router.get('/batches/:id', requireAuth, getBatch)

export default router

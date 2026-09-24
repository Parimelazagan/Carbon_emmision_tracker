import ConsumptionRecord from '../models/ConsumptionRecord.js'
import UploadBatch from '../models/UploadBatch.js'
import Facility from '../models/Facility.js'
import User from '../models/User.js'
import { parseUpload } from '../services/uploadParser.js'

/**
 * POST /api/upload
 */
export async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false, data: null,
        error: { message: 'No file uploaded. Send a CSV or Excel file in the "file" field.' },
      })
    }

    const ext = req.file.originalname.split('.').pop().toLowerCase()
    const fileType = ext === 'csv' ? 'csv' : 'excel'

    const { valid, rejected, totalRows } = await parseUpload(req.file.buffer, fileType)

    // Verify all facilityIds in valid rows belong to this org
    const facilityIds = [...new Set(valid.map((r) => r.data.facility))]
    const orgFacilities = await Facility.find(
      { _id: { $in: facilityIds }, organization: req.user.org },
      '_id',
    )
    const validFacilityIds = new Set(orgFacilities.map((f) => f._id.toString()))

    const toInsert = []
    const facilityRejected = []

    for (const row of valid) {
      if (!validFacilityIds.has(row.data.facility)) {
        facilityRejected.push({
          row: row.rowNumber,
          reasons: [`facilityId "${row.data.facility}" not found in your organization`],
        })
      } else {
        toInsert.push({
          facility: row.data.facility,
          date: row.data.date,
          type: row.data.type,
          amount: row.data.amount,
          unit: row.data.unit,
          region: row.data.region,
          calculatedCO2e: row.data.calculatedCO2e,
          scope: row.data.scope,
          enteredBy: req.user.sub,
          source: 'bulk_upload',
        })
      }
    }

    const allRejected = [...rejected, ...facilityRejected]

    let imported = []
    if (toInsert.length > 0) {
      imported = await ConsumptionRecord.insertMany(toInsert, { ordered: false })
    }

    const batch = await UploadBatch.create({
      fileName: req.file.originalname,
      organization: req.user.org,
      uploadedBy: req.user.sub,
      totalRows,
      importedRows: imported.length,
      rejectedRows: allRejected.length,
      rejectedDetails: allRejected,
    })

    return res.status(201).json({
      success: true,
      data: {
        batch,
        importedCount: imported.length,
        rejectedCount: allRejected.length,
        rejectedDetails: allRejected,
      },
      error: null,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/upload/batches
 * Directly scoped to org via the organization field (no User lookup needed).
 */
export async function listBatches(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const skip = (page - 1) * limit

    const filter = { organization: req.user.org }

    const [batches, total] = await Promise.all([
      UploadBatch.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name email')
        .select('-rejectedDetails'),
      UploadBatch.countDocuments(filter),
    ])

    return res.json({
      success: true,
      data: { batches, pagination: { total, page, limit, pages: Math.ceil(total / limit) } },
      error: null,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/upload/batches/:id
 */
export async function getBatch(req, res, next) {
  try {
    const batch = await UploadBatch.findById(req.params.id).populate('uploadedBy', 'name email')

    if (!batch) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Batch not found' } })
    }

    if (batch.organization.toString() !== req.user.org.toString()) {
      return res.status(403).json({ success: false, data: null, error: { message: 'Forbidden' } })
    }

    return res.json({ success: true, data: { batch }, error: null })
  } catch (err) {
    next(err)
  }
}

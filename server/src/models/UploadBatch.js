import mongoose from 'mongoose'

const rejectedDetailSchema = new mongoose.Schema(
  {
    row: { type: Number, required: true },
    reasons: { type: [String], required: true },
  },
  { _id: false },
)

const uploadBatchSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'uploadedBy user is required'],
    },
    totalRows: { type: Number, required: true, min: 0 },
    importedRows: { type: Number, required: true, min: 0 },
    rejectedRows: { type: Number, required: true, min: 0 },
    rejectedDetails: { type: [rejectedDetailSchema], default: [] },
  },
  { timestamps: true },
)

// Direct org index — replaces the expensive User lookup in listBatches
uploadBatchSchema.index({ organization: 1, createdAt: -1 })
uploadBatchSchema.index({ uploadedBy: 1 })

const UploadBatch = mongoose.model('UploadBatch', uploadBatchSchema)
export default UploadBatch

import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'generatedBy user is required'],
    },
    periodStart: {
      type: Date,
      required: [true, 'Period start date is required'],
    },
    periodEnd: {
      type: Date,
      required: [true, 'Period end date is required'],
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
      trim: true,
    },
  },
  { timestamps: true },
)

reportSchema.index({ organization: 1 })

const Report = mongoose.model('Report', reportSchema)
export default Report

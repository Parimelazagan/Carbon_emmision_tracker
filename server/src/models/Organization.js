import mongoose from 'mongoose'

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    baselineYear: {
      type: Number,
      min: [2000, 'Baseline year must be 2000 or later'],
      max: [new Date().getFullYear(), `Baseline year cannot be in the future`],
    },
  },
  { timestamps: true },
)

const Organization = mongoose.model('Organization', organizationSchema)
export default Organization

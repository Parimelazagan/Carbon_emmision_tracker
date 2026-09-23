import mongoose from 'mongoose'

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
  },
  { timestamps: true },
)

const Organization = mongoose.model('Organization', organizationSchema)
export default Organization

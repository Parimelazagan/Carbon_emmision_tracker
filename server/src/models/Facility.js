import mongoose from 'mongoose'

const facilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
)

facilitySchema.index({ organization: 1 })

const Facility = mongoose.model('Facility', facilitySchema)
export default Facility

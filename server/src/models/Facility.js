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
    floorAreaSqM: {
      type: Number,
      min: [0, 'Floor area must be non-negative'],
    },
    headcount: {
      type: Number,
      min: [0, 'Headcount must be non-negative'],
    },
  },
  { timestamps: true },
)

facilitySchema.index({ organization: 1 })

const Facility = mongoose.model('Facility', facilitySchema)
export default Facility

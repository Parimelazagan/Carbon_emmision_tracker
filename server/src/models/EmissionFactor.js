import mongoose from 'mongoose'

const emissionFactorSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Emission type is required'],
      enum: {
        values: ['electricity', 'diesel', 'petrol', 'natural_gas', 'water'],
        message: 'Invalid emission type',
      },
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      trim: true,
    },
    factorValue: {
      type: Number,
      required: [true, 'Factor value is required'],
      min: [0, 'Factor value must be non-negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
  },
  { timestamps: true },
)

// Each (type, region, unit) combination must be unique
emissionFactorSchema.index({ type: 1, region: 1, unit: 1 }, { unique: true })

const EmissionFactor = mongoose.model('EmissionFactor', emissionFactorSchema)
export default EmissionFactor

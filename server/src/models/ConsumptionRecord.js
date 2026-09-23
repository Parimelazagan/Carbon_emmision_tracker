import mongoose from 'mongoose'

const consumptionRecordSchema = new mongoose.Schema(
  {
    facility: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facility',
      required: [true, 'Facility is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    type: {
      type: String,
      required: [true, 'Emission type is required'],
      enum: {
        values: ['electricity', 'diesel', 'petrol', 'natural_gas', 'water'],
        message: 'Invalid emission type',
      },
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be non-negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
    calculatedCO2e: {
      type: Number,
      required: [true, 'Calculated CO2e is required'],
      min: [0, 'CO2e must be non-negative'],
    },
    scope: {
      type: Number,
      required: [true, 'Scope is required'],
      enum: {
        values: [1, 2, 3],
        message: 'Scope must be 1, 2, or 3',
      },
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'EnteredBy user is required'],
    },
    source: {
      type: String,
      required: [true, 'Source is required'],
      enum: {
        values: ['manual', 'bulk_upload'],
        message: 'Source must be manual or bulk_upload',
      },
    },
  },
  { timestamps: true },
)

// Indexes for every field dashboard queries filter or group by
consumptionRecordSchema.index({ date: 1 })
consumptionRecordSchema.index({ facility: 1 })
consumptionRecordSchema.index({ type: 1 })
consumptionRecordSchema.index({ scope: 1 })

const ConsumptionRecord = mongoose.model('ConsumptionRecord', consumptionRecordSchema)
export default ConsumptionRecord

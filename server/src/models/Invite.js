import mongoose from 'mongoose'

const inviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'data_entry', 'viewer'],
      default: 'viewer',
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // TTL index — MongoDB auto-deletes expired docs after they expire
      index: { expires: 0 },
    },
  },
  { timestamps: true },
)

inviteSchema.index({ email: 1, organization: 1 })

const Invite = mongoose.model('Invite', inviteSchema)
export default Invite

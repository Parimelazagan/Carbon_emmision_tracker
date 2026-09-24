import mongoose from 'mongoose'
import dns from 'dns'

// Node.js on Windows can fail SRV lookups via the default system resolver.
// Use public resolvers as a fallback to ensure Atlas mongodb+srv:// URIs work.
dns.setServers(['1.1.1.1', '8.8.8.8'])
dns.setDefaultResultOrder('ipv4first')

/**
 * Connect to MongoDB. Called once at server startup.
 * Exits the process on failure so a broken DB doesn't silently serve broken responses.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI is not set in environment variables')
    process.exit(1)
  }

  try {
    await mongoose.connect(uri)
    console.log(`MongoDB connected: ${mongoose.connection.host}`)
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  }
}

// Surface connection events so problems are visible in logs
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected')
})

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message)
})

export default mongoose

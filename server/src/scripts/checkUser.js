/**
 * Quick debug script — checks if demo user exists and verifies password hash.
 */
import 'dotenv/config'
import dns from 'dns'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import User from '../models/User.js'

dns.setDefaultResultOrder('ipv4first')
dns.setServers(['1.1.1.1', '8.8.8.8'])

async function check() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 })
  console.log('Connected to MongoDB')

  const user = await User.findOne({ email: 'demo@democorp.com' }).select('+passwordHash')
  if (!user) {
    console.log('❌ User not found: demo@democorp.com')
    console.log('   → The seed script did NOT run successfully, or ran against a different DB.')
  } else {
    console.log('✅ User found:', user.email, '| role:', user.role)
    const match = await bcrypt.compare('Demo1234!', user.passwordHash)
    console.log(match ? '✅ Password matches Demo1234!' : '❌ Password does NOT match Demo1234!')
    console.log('   passwordHash prefix:', user.passwordHash?.slice(0, 10))
  }

  await mongoose.disconnect()
}

check().catch((err) => {
  console.error('Check failed:', err.message)
  process.exit(1)
})

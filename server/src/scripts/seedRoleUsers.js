/**
 * Seed script to create data_entry (uploader) and viewer accounts for Demo Corp.
 */
import 'dotenv/config'
import dns from 'dns'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import Organization from '../models/Organization.js'
import User from '../models/User.js'

dns.setDefaultResultOrder('ipv4first')
dns.setServers(['1.1.1.1', '8.8.8.8'])

async function seedRoleUsers() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 })
  console.log('Connected to MongoDB')

  let org = await Organization.findOne({ name: 'Demo Corp' })
  if (!org) {
    org = await Organization.findOne()
  }

  if (!org) {
    console.error('No organization found. Please run sample seed first.')
    process.exit(1)
  }

  const defaultPasswordHash = await bcrypt.hash('Demo1234!', 12)

  const testAccounts = [
    {
      name: 'Demo Uploader',
      email: 'uploader@democorp.com',
      passwordHash: defaultPasswordHash,
      role: 'data_entry',
      organization: org._id,
    },
    {
      name: 'Demo Viewer',
      email: 'viewer@democorp.com',
      passwordHash: defaultPasswordHash,
      role: 'viewer',
      organization: org._id,
    },
  ]

  for (const acc of testAccounts) {
    const existing = await User.findOne({ email: acc.email })
    if (!existing) {
      await User.create(acc)
      console.log(`✅ Created ${acc.role} user: ${acc.email}`)
    } else {
      existing.role = acc.role
      existing.passwordHash = defaultPasswordHash
      await existing.save()
      console.log(`🔄 Updated ${acc.role} user: ${acc.email}`)
    }
  }

  console.log('Finished seeding role accounts.')
  await mongoose.disconnect()
}

seedRoleUsers().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})

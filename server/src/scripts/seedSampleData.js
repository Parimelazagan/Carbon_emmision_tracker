/**
 * Seed script — inserts sample organizations, facilities, and consumption
 * records that exercise the new schema fields:
 *   - Organization.baselineYear
 *   - Facility.floorAreaSqM / headcount (some filled, some blank)
 *   - ConsumptionRecord.verificationStatus (mix of verified/estimated/unverified)
 *
 * Safe to re-run — uses upserts so it won't duplicate data.
 *
 * Run:  node src/scripts/seedSampleData.js
 *
 * NOTE: This creates a demo org + demo user. Do NOT run against a production DB
 * that already has real user accounts — the demo email is intentionally obvious.
 */

import 'dotenv/config'
import dns from 'dns'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import Organization from '../models/Organization.js'
import Facility from '../models/Facility.js'
import User from '../models/User.js'
import ConsumptionRecord from '../models/ConsumptionRecord.js'
import EmissionFactor from '../models/EmissionFactor.js'

dns.setServers(['1.1.1.1', '8.8.8.8'])
dns.setDefaultResultOrder('ipv4first')

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 })
  console.log('Connected to MongoDB')

  // ── Organization ────────────────────────────────────────────────────────────
  let org = await Organization.findOne({ name: 'Demo Corp' })
  if (!org) {
    org = await Organization.create({ name: 'Demo Corp', baselineYear: 2022 })
    console.log('Created org:', org.name)
  } else {
    // Update existing demo org to include baselineYear
    org.baselineYear = 2022
    await org.save()
    console.log('Updated org with baselineYear:', org.name)
  }

  // ── Admin user ──────────────────────────────────────────────────────────────
  let adminUser = await User.findOne({ email: 'demo@democorp.com' })
  if (!adminUser) {
    adminUser = await User.create({
      name: 'Demo Admin',
      email: 'demo@democorp.com',
      passwordHash: await bcrypt.hash('Demo1234!', 12),
      role: 'admin',
      organization: org._id,
    })
    console.log('Created admin user:', adminUser.email)
  }

  // ── Facilities — mix of filled and blank intensity fields ───────────────────
  const facilitySeed = [
    {
      name: 'HQ Office',
      location: 'Mumbai, India',
      floorAreaSqM: 2400,
      headcount: 120,
    },
    {
      name: 'Warehouse A',
      location: 'Pune, India',
      floorAreaSqM: 8500,
      headcount: 45,
    },
    {
      name: 'Remote Site B',
      location: 'Chennai, India',
      // Intentionally no floorAreaSqM or headcount — tests "—" display
    },
  ]

  const facilities = []
  for (const f of facilitySeed) {
    let facility = await Facility.findOne({ name: f.name, organization: org._id })
    if (!facility) {
      facility = await Facility.create({ ...f, organization: org._id })
      console.log('Created facility:', facility.name)
    } else {
      Object.assign(facility, f)
      await facility.save()
      console.log('Updated facility:', facility.name)
    }
    facilities.push(facility)
  }

  // ── Consumption records — mix of verification statuses ──────────────────────
  // Look up a real emission factor so calculatedCO2e is correct
  const electricityFactor = await EmissionFactor.findOne({ type: 'electricity', region: 'India', unit: 'kWh' })
  const dieselFactor       = await EmissionFactor.findOne({ type: 'diesel',      region: 'India', unit: 'litre' })
  const waterFactor        = await EmissionFactor.findOne({ type: 'water',       region: 'India', unit: 'm3' })

  if (!electricityFactor || !dieselFactor || !waterFactor) {
    console.warn('Some emission factors missing — run seedEmissionFactors.js first')
    await mongoose.disconnect()
    return
  }

  const records = [
    // HQ — electricity, verified
    {
      facility: facilities[0]._id,
      date: new Date('2026-01-15'),
      type: 'electricity',
      amount: 5000,
      unit: 'kWh',
      region: 'India',
      calculatedCO2e: 5000 * electricityFactor.factorValue,
      scope: 2,
      enteredBy: adminUser._id,
      source: 'manual',
      verificationStatus: 'verified',
      verifiedBy: adminUser._id,
      verifiedAt: new Date('2026-02-01'),
    },
    // HQ — electricity, estimated
    {
      facility: facilities[0]._id,
      date: new Date('2026-02-15'),
      type: 'electricity',
      amount: 4800,
      unit: 'kWh',
      region: 'India',
      calculatedCO2e: 4800 * electricityFactor.factorValue,
      scope: 2,
      enteredBy: adminUser._id,
      source: 'manual',
      verificationStatus: 'estimated',
    },
    // Warehouse — diesel, unverified (default)
    {
      facility: facilities[1]._id,
      date: new Date('2026-01-20'),
      type: 'diesel',
      amount: 300,
      unit: 'litre',
      region: 'India',
      calculatedCO2e: 300 * dieselFactor.factorValue,
      scope: 1,
      enteredBy: adminUser._id,
      source: 'manual',
      verificationStatus: 'unverified',
    },
    // Remote site — water, unverified
    {
      facility: facilities[2]._id,
      date: new Date('2026-01-10'),
      type: 'water',
      amount: 150,
      unit: 'm3',
      region: 'India',
      calculatedCO2e: 150 * waterFactor.factorValue,
      scope: 3,
      enteredBy: adminUser._id,
      source: 'bulk_upload',
      verificationStatus: 'unverified',
    },
    // Warehouse — diesel, verified
    {
      facility: facilities[1]._id,
      date: new Date('2026-03-05'),
      type: 'diesel',
      amount: 420,
      unit: 'litre',
      region: 'India',
      calculatedCO2e: 420 * dieselFactor.factorValue,
      scope: 1,
      enteredBy: adminUser._id,
      source: 'manual',
      verificationStatus: 'verified',
      verifiedBy: adminUser._id,
      verifiedAt: new Date('2026-03-10'),
    },
  ]

  for (const r of records) {
    const existing = await ConsumptionRecord.findOne({
      facility: r.facility,
      date: r.date,
      type: r.type,
      source: r.source,
    })
    if (!existing) {
      await ConsumptionRecord.create(r)
      console.log(`Created ${r.verificationStatus} ${r.type} record for facility index ${facilities.findIndex(f => f._id.equals(r.facility))}`)
    } else {
      console.log(`Skipped existing record: ${r.type} on ${r.date.toISOString().split('T')[0]}`)
    }
  }

  console.log('\nSample data seed complete.')
  console.log('Demo login:  demo@democorp.com / Demo1234!')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})

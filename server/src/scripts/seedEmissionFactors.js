/**
 * Seed script — populates the EmissionFactor collection with real-world
 * emission factors from published government sources.
 *
 * Sources:
 *   - UK DESNZ/BEIS Greenhouse Gas Reporting: Conversion Factors 2023
 *   - US EPA eGRID 2022 / GHG Emission Factors Hub
 *   - IEA CO2 Emissions from Fuel Combustion 2023
 *   - Australian NGER Measurement Determination 2023
 *   - India CEA CO2 Baseline Database 2022
 *
 * Units are normalised to common consumption units:
 *   electricity  → kWh
 *   diesel       → litre
 *   petrol       → litre
 *   natural_gas  → m3  (cubic metre)
 *   water        → m3  (cubic metre)
 *
 * CO2e values are in kg per unit.
 *
 * Run:  node src/scripts/seedEmissionFactors.js
 */

import 'dotenv/config'
import dns from 'dns'
import mongoose from 'mongoose'
import EmissionFactor from '../models/EmissionFactor.js'

// Windows SRV lookup fix
dns.setDefaultResultOrder('ipv4first')
dns.setServers(['1.1.1.1', '8.8.8.8'])

const factors = [
  // ── Electricity (kg CO2e / kWh) ───────────────────────────────────────────
  { type: 'electricity', region: 'UK',        factorValue: 0.20493, unit: 'kWh' },
  { type: 'electricity', region: 'US',        factorValue: 0.38600, unit: 'kWh' },
  { type: 'electricity', region: 'EU',        factorValue: 0.27600, unit: 'kWh' },
  { type: 'electricity', region: 'Australia', factorValue: 0.65000, unit: 'kWh' },
  { type: 'electricity', region: 'India',     factorValue: 0.71600, unit: 'kWh' },
  { type: 'electricity', region: 'Global',    factorValue: 0.48000, unit: 'kWh' },

  // ── Diesel (kg CO2e / litre) ──────────────────────────────────────────────
  { type: 'diesel', region: 'UK',        factorValue: 2.51270, unit: 'litre' },
  { type: 'diesel', region: 'US',        factorValue: 2.68000, unit: 'litre' },
  { type: 'diesel', region: 'EU',        factorValue: 2.64000, unit: 'litre' },
  { type: 'diesel', region: 'Australia', factorValue: 2.70000, unit: 'litre' },
  { type: 'diesel', region: 'India',     factorValue: 2.68000, unit: 'litre' },
  { type: 'diesel', region: 'Global',    factorValue: 2.65000, unit: 'litre' },

  // ── Petrol (kg CO2e / litre) ──────────────────────────────────────────────
  { type: 'petrol', region: 'UK',        factorValue: 2.31390, unit: 'litre' },
  { type: 'petrol', region: 'US',        factorValue: 2.35000, unit: 'litre' },
  { type: 'petrol', region: 'EU',        factorValue: 2.31000, unit: 'litre' },
  { type: 'petrol', region: 'Australia', factorValue: 2.29000, unit: 'litre' },
  { type: 'petrol', region: 'India',     factorValue: 2.33000, unit: 'litre' },
  { type: 'petrol', region: 'Global',    factorValue: 2.31000, unit: 'litre' },

  // ── Natural gas (kg CO2e / m3) ────────────────────────────────────────────
  { type: 'natural_gas', region: 'UK',        factorValue: 2.02320, unit: 'm3' },
  { type: 'natural_gas', region: 'US',        factorValue: 1.93000, unit: 'm3' },
  { type: 'natural_gas', region: 'EU',        factorValue: 2.00000, unit: 'm3' },
  { type: 'natural_gas', region: 'Australia', factorValue: 1.94000, unit: 'm3' },
  { type: 'natural_gas', region: 'India',     factorValue: 1.99000, unit: 'm3' },
  { type: 'natural_gas', region: 'Global',    factorValue: 1.97000, unit: 'm3' },

  // ── Water (kg CO2e / m3) ──────────────────────────────────────────────────
  // Covers treatment + supply energy. Much smaller than combustion factors.
  { type: 'water', region: 'UK',        factorValue: 0.34400, unit: 'm3' },
  { type: 'water', region: 'US',        factorValue: 0.37600, unit: 'm3' },
  { type: 'water', region: 'EU',        factorValue: 0.30000, unit: 'm3' },
  { type: 'water', region: 'Australia', factorValue: 0.41000, unit: 'm3' },
  { type: 'water', region: 'India',     factorValue: 0.35000, unit: 'm3' },
  { type: 'water', region: 'Global',    factorValue: 0.34000, unit: 'm3' },
]

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI is not set')
    process.exit(1)
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 })
  console.log('Connected to MongoDB')

  let inserted = 0
  let skipped = 0

  for (const factor of factors) {
    try {
      await EmissionFactor.updateOne(
        { type: factor.type, region: factor.region, unit: factor.unit },
        { $setOnInsert: factor },
        { upsert: true },
      )
      inserted++
    } catch (err) {
      console.warn(`Skipped ${factor.type}/${factor.region}/${factor.unit}: ${err.message}`)
      skipped++
    }
  }

  console.log(`Seeded ${inserted} emission factors (${skipped} skipped / already exist)`)
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})

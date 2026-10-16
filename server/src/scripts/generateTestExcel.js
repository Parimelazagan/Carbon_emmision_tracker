/**
 * Generates test_upload.xlsx in the project root.
 * Run: node generate_test_excel.js
 */
import ExcelJS from 'exceljs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const rows = [
  // Jan 2026
  ['2026-01-05', '6ab53ecab5b58d57eaec7d2a', 'electricity',  6200, 'kWh',   'India'],
  ['2026-01-10', '6ab53ecab5b58d57eaec7d2e', 'diesel',        450, 'litre', 'India'],
  ['2026-01-15', '6ab53ecab5b58d57eaec7d31', 'water',         180, 'm3',    'India'],
  ['2026-01-20', '6ab53ecab5b58d57eaec7d2a', 'natural_gas',   320, 'm3',    'India'],
  ['2026-01-25', '6ab53ecab5b58d57eaec7d2e', 'electricity',  3800, 'kWh',   'India'],
  // Feb 2026
  ['2026-02-03', '6ab53ecab5b58d57eaec7d2a', 'electricity',  5900, 'kWh',   'India'],
  ['2026-02-07', '6ab53ecab5b58d57eaec7d31', 'diesel',        210, 'litre', 'India'],
  ['2026-02-12', '6ab53ecab5b58d57eaec7d2e', 'petrol',        175, 'litre', 'India'],
  ['2026-02-18', '6ab53ecab5b58d57eaec7d2a', 'water',          95, 'm3',    'India'],
  ['2026-02-22', '6ab53ecab5b58d57eaec7d2e', 'natural_gas',   260, 'm3',    'India'],
  // Mar 2026
  ['2026-03-01', '6ab53ecab5b58d57eaec7d2a', 'electricity',  6700, 'kWh',   'India'],
  ['2026-03-06', '6ab53ecab5b58d57eaec7d31', 'electricity',  1200, 'kWh',   'India'],
  ['2026-03-10', '6ab53ecab5b58d57eaec7d2e', 'diesel',        530, 'litre', 'India'],
  ['2026-03-15', '6ab53ecab5b58d57eaec7d2a', 'petrol',         90, 'litre', 'India'],
  ['2026-03-20', '6ab53ecab5b58d57eaec7d31', 'water',         220, 'm3',    'India'],
  // Apr 2026
  ['2026-04-02', '6ab53ecab5b58d57eaec7d2a', 'electricity',  6100, 'kWh',   'India'],
  ['2026-04-08', '6ab53ecab5b58d57eaec7d2e', 'electricity',  4100, 'kWh',   'India'],
  ['2026-04-14', '6ab53ecab5b58d57eaec7d31', 'natural_gas',   140, 'm3',    'India'],
  ['2026-04-19', '6ab53ecab5b58d57eaec7d2a', 'diesel',        380, 'litre', 'India'],
  ['2026-04-25', '6ab53ecab5b58d57eaec7d2e', 'water',         310, 'm3',    'India'],
  // May 2026
  ['2026-05-05', '6ab53ecab5b58d57eaec7d2a', 'electricity',  5800, 'kWh',   'India'],
  ['2026-05-09', '6ab53ecab5b58d57eaec7d31', 'diesel',        290, 'litre', 'India'],
  ['2026-05-14', '6ab53ecab5b58d57eaec7d2e', 'petrol',        200, 'litre', 'India'],
  ['2026-05-20', '6ab53ecab5b58d57eaec7d2a', 'natural_gas',   410, 'm3',    'India'],
  ['2026-05-26', '6ab53ecab5b58d57eaec7d31', 'electricity',   980, 'kWh',   'India'],
  // Jun 2026
  ['2026-06-03', '6ab53ecab5b58d57eaec7d2a', 'electricity',  7200, 'kWh',   'India'],
  ['2026-06-08', '6ab53ecab5b58d57eaec7d2e', 'diesel',        610, 'litre', 'India'],
  ['2026-06-13', '6ab53ecab5b58d57eaec7d2a', 'water',         110, 'm3',    'India'],
  ['2026-06-18', '6ab53ecab5b58d57eaec7d31', 'petrol',        130, 'litre', 'India'],
  ['2026-06-24', '6ab53ecab5b58d57eaec7d2e', 'electricity',  4400, 'kWh',   'India'],
]

async function generate() {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'CarbonTrack ESG Platform'
  wb.created = new Date()

  const ws = wb.addWorksheet('Consumption Data')

  // Header row — styled
  ws.columns = [
    { header: 'date',       key: 'date',       width: 14 },
    { header: 'facilityId', key: 'facilityId', width: 30 },
    { header: 'type',       key: 'type',       width: 16 },
    { header: 'amount',     key: 'amount',     width: 12 },
    { header: 'unit',       key: 'unit',       width: 10 },
    { header: 'region',     key: 'region',     width: 12 },
  ]

  // Style header row
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 22

  // Facility name comment column (helper, not parsed)
  ws.getColumn(2).note = 'Paste the exact MongoDB _id of the facility'

  // Add data rows
  rows.forEach((row, i) => {
    const r = ws.addRow({
      date: row[0],
      facilityId: row[1],
      type: row[2],
      amount: row[3],
      unit: row[4],
      region: row[5],
    })
    // Alternate row shading
    if (i % 2 === 0) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }
    }
  })

  // Add a second sheet with facility reference
  const refSheet = wb.addWorksheet('Facility Reference')
  refSheet.columns = [
    { header: 'Facility Name', key: 'name', width: 20 },
    { header: 'Location',      key: 'loc',  width: 20 },
    { header: 'facilityId (_id to use in upload)', key: 'id', width: 36 },
  ]
  const refHeader = refSheet.getRow(1)
  refHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  refHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }

  refSheet.addRow({ name: 'HQ Office',      loc: 'Mumbai, India',  id: '6ab53ecab5b58d57eaec7d2a' })
  refSheet.addRow({ name: 'Warehouse A',    loc: 'Pune, India',    id: '6ab53ecab5b58d57eaec7d2e' })
  refSheet.addRow({ name: 'Remote Site B',  loc: 'Chennai, India', id: '6ab53ecab5b58d57eaec7d31' })

  const outPath = path.join(__dirname, 'test_upload.xlsx')
  await wb.xlsx.writeFile(outPath)
  console.log(`✅ Generated: ${outPath}`)
  console.log(`   30 rows across 3 facilities × 5 emission types × 6 months (Jan–Jun 2026)`)
  console.log(`   Sheet 2 "Facility Reference" lists all facilityIds for reference.`)
}

generate().catch(console.error)

import ConsumptionRecord from '../models/ConsumptionRecord.js'
import Facility from '../models/Facility.js'

/**
 * Resolve facility IDs for an org, optionally filtered to a single facility.
 * Every aggregation uses this to scope data to the authenticated org.
 */
async function orgFacilityIds(orgId, facilityId) {
  const filter = { organization: orgId }
  if (facilityId) filter._id = facilityId
  const facilities = await Facility.find(filter, '_id')
  return facilities.map((f) => f._id)
}

/**
 * Build a shared $match stage used by all pipelines.
 * @param {ObjectId[]} facilityIds
 * @param {Date|null}  from
 * @param {Date|null}  to
 */
function dateMatch(facilityIds, from, to) {
  const match = { facility: { $in: facilityIds } }
  if (from || to) {
    match.date = {}
    if (from) match.date.$gte = new Date(from)
    if (to) match.date.$lte = new Date(to)
  }
  return match
}

// ── 1. Emissions trend ────────────────────────────────────────────────────────
/**
 * Monthly CO2e totals bucketed by YYYY-MM.
 * Returns: [{ month: '2026-01', co2e: 1234.56 }, ...]
 */
export async function emissionsTrend({ orgId, facilityId, from, to }) {
  const facilityIds = await orgFacilityIds(orgId, facilityId)
  if (!facilityIds.length) return []

  return ConsumptionRecord.aggregate([
    { $match: dateMatch(facilityIds, from, to) },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
        co2e: { $sum: '$calculatedCO2e' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, month: '$_id', co2e: { $round: ['$co2e', 4] } } },
  ])
}

// ── 2. Emissions by scope ─────────────────────────────────────────────────────
/**
 * Total CO2e grouped by GHG scope.
 * Returns: [{ scope: 'Scope 1', co2e: 500 }, ...]
 */
export async function emissionsByScope({ orgId, facilityId, from, to }) {
  const facilityIds = await orgFacilityIds(orgId, facilityId)
  if (!facilityIds.length) return []

  const raw = await ConsumptionRecord.aggregate([
    { $match: dateMatch(facilityIds, from, to) },
    {
      $group: {
        _id: '$scope',
        co2e: { $sum: '$calculatedCO2e' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, scope: { $concat: ['Scope ', { $toString: '$_id' }] }, co2e: { $round: ['$co2e', 4] } } },
  ])

  return raw
}

// ── 3. Emissions by source type ───────────────────────────────────────────────
/**
 * Total CO2e grouped by emission type (electricity, diesel, etc.).
 * Returns: [{ type: 'electricity', co2e: 800 }, ...]
 */
export async function emissionsByType({ orgId, facilityId, from, to }) {
  const facilityIds = await orgFacilityIds(orgId, facilityId)
  if (!facilityIds.length) return []

  return ConsumptionRecord.aggregate([
    { $match: dateMatch(facilityIds, from, to) },
    {
      $group: {
        _id: '$type',
        co2e: { $sum: '$calculatedCO2e' },
      },
    },
    { $sort: { co2e: -1 } },
    { $project: { _id: 0, type: '$_id', co2e: { $round: ['$co2e', 4] } } },
  ])
}

// ── 4. Emissions by facility ──────────────────────────────────────────────────
/**
 * Total CO2e per facility, sorted descending.
 * Returns: [{ facilityId, facilityName, co2e }, ...]
 */
export async function emissionsByFacility({ orgId, from, to }) {
  const facilityIds = await orgFacilityIds(orgId, null)
  if (!facilityIds.length) return []

  return ConsumptionRecord.aggregate([
    { $match: dateMatch(facilityIds, from, to) },
    {
      $group: {
        _id: '$facility',
        co2e: { $sum: '$calculatedCO2e' },
      },
    },
    { $sort: { co2e: -1 } },
    {
      $lookup: {
        from: 'facilities',
        localField: '_id',
        foreignField: '_id',
        as: 'facilityDoc',
      },
    },
    { $unwind: { path: '$facilityDoc', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        facilityId: '$_id',
        facilityName: { $ifNull: ['$facilityDoc.name', 'Unknown'] },
        co2e: { $round: ['$co2e', 4] },
      },
    },
  ])
}

// ── 5. Summary stats ──────────────────────────────────────────────────────────
/**
 * Aggregated summary cards for the dashboard header.
 * Returns: { totalCO2e, recordCount, avgCO2ePerRecord, periodCO2e, prevPeriodCO2e, pctChange }
 *
 * "period" = from..to window; "prevPeriod" = same-length window immediately before.
 */
export async function summaryStats({ orgId, facilityId, from, to }) {
  const facilityIds = await orgFacilityIds(orgId, facilityId)
  if (!facilityIds.length) {
    return { totalCO2e: 0, recordCount: 0, avgCO2ePerRecord: 0, periodCO2e: 0, prevPeriodCO2e: 0, pctChange: null }
  }

  const match = dateMatch(facilityIds, from, to)

  const [result] = await ConsumptionRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalCO2e: { $sum: '$calculatedCO2e' },
        recordCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        totalCO2e: { $round: ['$totalCO2e', 4] },
        recordCount: 1,
        avgCO2ePerRecord: {
          $round: [{ $cond: [{ $eq: ['$recordCount', 0] }, 0, { $divide: ['$totalCO2e', '$recordCount'] }] }, 4],
        },
      },
    },
  ])

  const periodCO2e = result?.totalCO2e ?? 0
  const recordCount = result?.recordCount ?? 0
  const avgCO2ePerRecord = result?.avgCO2ePerRecord ?? 0

  // Previous period comparison — only if both from and to are provided
  let prevPeriodCO2e = 0
  let pctChange = null

  if (from && to) {
    const periodMs = new Date(to) - new Date(from)
    const prevFrom = new Date(new Date(from) - periodMs)
    const prevTo = new Date(new Date(from) - 1) // 1ms before current period starts

    const prevMatch = dateMatch(facilityIds, prevFrom, prevTo)
    const [prevResult] = await ConsumptionRecord.aggregate([
      { $match: prevMatch },
      { $group: { _id: null, totalCO2e: { $sum: '$calculatedCO2e' } } },
      { $project: { _id: 0, totalCO2e: { $round: ['$totalCO2e', 4] } } },
    ])

    prevPeriodCO2e = prevResult?.totalCO2e ?? 0
    if (prevPeriodCO2e > 0) {
      pctChange = Math.round(((periodCO2e - prevPeriodCO2e) / prevPeriodCO2e) * 10000) / 100
    }
  }

  return { totalCO2e: periodCO2e, recordCount, avgCO2ePerRecord, prevPeriodCO2e, pctChange }
}

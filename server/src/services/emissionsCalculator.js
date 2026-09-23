import EmissionFactor from '../models/EmissionFactor.js'

/**
 * Scope classification by emission type (GHG Protocol).
 * Scope 1 = direct combustion, Scope 2 = purchased electricity, Scope 3 = other.
 */
export function classifyScope(type) {
  switch (type) {
    case 'diesel':
    case 'petrol':
    case 'natural_gas':
      return 1
    case 'electricity':
      return 2
    case 'water':
      return 3
    default:
      return 3
  }
}

/**
 * Look up the matching EmissionFactor and return { co2e, scope }.
 *
 * @param {string} type    - emission type (electricity | diesel | petrol | natural_gas | water)
 * @param {number} amount  - consumption quantity
 * @param {string} unit    - unit of measure (must match a stored EmissionFactor unit)
 * @param {string} region  - region code (must match a stored EmissionFactor region)
 * @returns {{ co2e: number, scope: number }}
 * @throws if no matching EmissionFactor is found
 */
export async function calculateEmissions(type, amount, unit, region) {
  const factor = await EmissionFactor.findOne({ type, unit, region })

  if (!factor) {
    const err = new Error(
      `No emission factor found for type="${type}", unit="${unit}", region="${region}"`,
    )
    err.status = 422
    throw err
  }

  const co2e = amount * factor.factorValue
  const scope = classifyScope(type)

  return { co2e, scope }
}

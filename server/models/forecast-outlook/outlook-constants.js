// Enums for better code maintainability
const Source = { River: 0, Sea: 1, Surface: 2, Ground: 3 }
const Impact = { None: 0, Minimal: 1, Minor: 2, Significant: 3, Severe: 4 }
const Likelihood = { None: 0, VeryLow: 1, Low: 2, Medium: 3, High: 4 }

// Source priority for consistent ordering
const SOURCE_ORDER = [Source.River, Source.Sea, Source.Surface, Source.Ground]

// Priority orders (highest first)
const IMPACT_PRIORITY_ORDER = [Impact.Severe, Impact.Significant, Impact.Minor]
const LIKELIHOOD_PRIORITY_ORDER = [Likelihood.High, Likelihood.Medium, Likelihood.Low]

// Impact content mapping
const IMPACT_CONTENT = {
  [Impact.Minor]: 'Localised property flooding and travel disruption',
  [Impact.Significant]: 'Property flooding and significant travel disruption',
  [Impact.Severe]: 'Severe or widespread property flooding and travel disruption'
}

// Likelihood content mapping
const LIKELIHOOD_CONTENT = {
  [Likelihood.Low]: 'is possible',
  [Likelihood.Medium]: 'is likely',
  [Likelihood.High]: 'is expected'
}

// Source location content mapping
const LOCATION_CONTENT = {
  0: 'in riverside areas',
  1: 'in coastal areas',
  2: 'in areas at risk from surface water',
  3: 'in areas at risk from groundwater',
  '0,1': 'in riverside and coastal areas',
  '0,2': 'in riverside areas, and areas at risk from surface water',
  '0,3': 'in riverside areas, and areas at risk from groundwater',
  '0,1,2': 'in riverside and coastal areas, and areas at risk from surface water',
  '0,1,3': 'in riverside and coastal areas, and areas at risk from groundwater',
  '0,2,3': 'in riverside areas, and areas at risk from surface water and groundwater',
  '0,1,2,3': 'in riverside and coastal areas, and areas at risk from surface water and groundwater',
  '1,2': 'in coastal areas, and areas at risk from surface water',
  '1,3': 'in coastal areas, and areas at risk from groundwater',
  '1,2,3': 'in coastal areas, and areas at risk from surface water and groundwater',
  '2,3': 'in areas at risk from surface water and groundwater'
}

// Allowed impact-likelihood pairs after filtering
const VALID_RISK_PAIRS = new Set([
  '2-2', '2-3', '2-4',
  '3-2', '3-3', '3-4',
  '4-2', '4-3', '4-4'
])

// Constants for algorithm limits
const MAX_ITERATIONS = 20
const DAYS_COUNT = 5
// Constants for sentence count calculation thresholds
const ONE_SENTENCE_MAX = 2
const TWO_SENTENCES_MIN = 3
const TWO_SENTENCES_MAX = 4
const THREE_SENTENCES_TOTAL = 5
// Constants for sorting priorities
const FIRST_SOURCE_INDEX = 0
// Constants for array sorting
const sortAscending = (a, b) => a - b
// Constants for content messages
const VERY_LOW_RISK_MESSAGE = 'The flood risk is very low.'

module.exports = {
  Source,
  Impact,
  Likelihood,
  SOURCE_ORDER,
  IMPACT_PRIORITY_ORDER,
  LIKELIHOOD_PRIORITY_ORDER,
  IMPACT_CONTENT,
  LIKELIHOOD_CONTENT,
  LOCATION_CONTENT,
  VALID_RISK_PAIRS,
  MAX_ITERATIONS,
  DAYS_COUNT,
  ONE_SENTENCE_MAX,
  TWO_SENTENCES_MIN,
  TWO_SENTENCES_MAX,
  THREE_SENTENCES_TOTAL,
  FIRST_SOURCE_INDEX,
  sortAscending,
  VERY_LOW_RISK_MESSAGE
}

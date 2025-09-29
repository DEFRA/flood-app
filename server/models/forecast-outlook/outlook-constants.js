// Flood Risk Outlook Constants and Configuration
// This file defines all the business rules, enums, and mappings used throughout the flood outlook system.
// Understanding these constants is key to understanding how flood risks are calculated and displayed.

// ===== RISK LEVEL DEFINITIONS =====
// These enums represent the core flood risk assessment scales
const Source = { River: 0, Sea: 1, Surface: 2, Ground: 3 }
const Impact = { None: 0, Minimal: 1, Minor: 2, Significant: 3, Severe: 4 }
const Likelihood = { None: 0, VeryLow: 1, Low: 2, Medium: 3, High: 4 }

// ===== PROCESSING ORDER RULES =====
// These determine the order in which different risk factors are processed and displayed

// Source processing order - rivers first, then coastal, surface, groundwater
const SOURCE_ORDER = [Source.River, Source.Sea, Source.Surface, Source.Ground]

// Priority orders for sorting risks (highest impact/likelihood first)
const IMPACT_PRIORITY_ORDER = [Impact.Severe, Impact.Significant, Impact.Minor]
const LIKELIHOOD_PRIORITY_ORDER = [Likelihood.High, Likelihood.Medium, Likelihood.Low]

// ===== CONTENT MAPPINGS =====
// These convert numeric risk levels into human-readable text

// Impact descriptions for flood content generation
const IMPACT_CONTENT = {
  [Impact.Minor]: 'Localised property flooding and travel disruption',
  [Impact.Significant]: 'Property flooding and significant travel disruption',
  [Impact.Severe]: 'Severe or widespread property flooding and travel disruption'
}

// Likelihood descriptions for flood content generation
const LIKELIHOOD_CONTENT = {
  [Likelihood.Low]: 'is possible',
  [Likelihood.Medium]: 'is likely',
  [Likelihood.High]: 'is expected'
}

// Location descriptions based on which sources are affected
// Keys are comma-separated source IDs (eg: 0=river, 0,1=river and coastal)
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

// ===== BUSINESS RULES =====
// These define what combinations of impact and likelihood are considered valid risks

// Only these impact-likelihood combinations are considered reportable flood risks
// Format: "impact-likelihood" (e.g., "2-2" = minor impact, low likelihood)
// Excludes very low likelihoods with minor impacts, and any minimal impacts
const VALID_RISK_PAIRS = new Set([
  '2-2', '2-3', '2-4',
  '3-2', '3-3', '3-4',
  '4-2', '4-3', '4-4'
])

// ===== ALGORITHM CONFIGURATION =====
// These control the behavior of the content generation algorithms

// Safety limit to prevent infinite loops in risk combination selection
const MAX_ITERATIONS = 20

// Number of days in the outlook (today + 4 future days)
const DAYS_COUNT = 5

// ===== CONTENT GENERATION RULES =====
// These determine how many sentences to generate based on risk complexity

// Sentence count thresholds based on unique impact+likelihood combinations
const ONE_SENTENCE_MAX = 2 // 1-2 unique combinations = 1 sentence
const TWO_SENTENCES_MIN = 3; const TWO_SENTENCES_MAX = 4 // 3-4 unique combinations = 2 sentences
const THREE_SENTENCES_TOTAL = 5 // 5 unique combinations = 3 sentences
// More than 5 = 4 sentences (maximum)

// ===== SORTING AND INDEXING =====
// Constants for array indexing and sorting logic

// When sorting by source, use the first source in the list
const FIRST_SOURCE_INDEX = 0

// ===== FALLBACK MESSAGE =====
// Message shown when flood risk is very low or non-existent
const VERY_LOW_RISK_MESSAGE = 'The flood risk is very low.'

// ===== MAP TOOLTIPS =====
// Detailed risk descriptions shown in map popups/ tooltips
// Format: "risklevel-i{impact}-l{likelihood}"
const MAP_MESSAGE_CONTENT = {
  '1-i2-l2': 'Very low risk, impact minor (2), likelihood low (2).',
  '2-i2-l3': 'Low risk, impact minor (2), likelihood medium (3).',
  '2-i2-l4': 'Low risk, impact minor (2), likelihood high (4).',
  '2-i3-l1': 'Low risk, impact significant (3), likelihood very low (1).',
  '2-i3-l2': 'Low risk, impact significant (3), likelihood low (2).',
  '2-i4-l1': 'Low risk, impact severe (4), likelihood very low (1).',
  '3-i3-l3': 'Medium risk, impact significant (3), likelihood medium (3).',
  '3-i3-l4': 'Medium risk, impact significant (3), likelihood high (4).',
  '3-i4-l2': 'Medium risk, impact severe (4), likelihood low (2).',
  '3-i4-l3': 'Medium risk, impact severe (4), likelihood medium (3).',
  '4-i4-l4': 'High risk, impact severe (4), likelihood high (4).'
}

// ===== EXPORT GROUPING =====
// Group related constants together for cleaner imports

// Algorithm configuration constants
const CONFIG = Object.freeze({
  MAX_ITERATIONS,
  DAYS_COUNT,
  ONE_SENTENCE_MAX,
  TWO_SENTENCES_MIN,
  TWO_SENTENCES_MAX,
  THREE_SENTENCES_TOTAL,
  FIRST_SOURCE_INDEX
})

// Human-readable content mappings
const CONTENT = Object.freeze({
  IMPACT: IMPACT_CONTENT,
  LIKELIHOOD: LIKELIHOOD_CONTENT,
  LOCATION: LOCATION_CONTENT,
  MAP_MESSAGE: MAP_MESSAGE_CONTENT,
  VERY_LOW_RISK_MESSAGE
})

// Processing priority rules
const PRIORITIES = Object.freeze({
  SOURCE_ORDER,
  IMPACT_PRIORITY_ORDER,
  LIKELIHOOD_PRIORITY_ORDER
})

module.exports = {
  Source,
  Impact,
  Likelihood,
  VALID_RISK_PAIRS,
  CONFIG,
  CONTENT,
  PRIORITIES
}

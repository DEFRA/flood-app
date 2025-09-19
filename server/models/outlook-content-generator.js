// 5 Day Forecast (5DF) Content Generator
// Processes 5×4×2 risk matrix: [day][source][impact, likelihood]
// Generates human-readable flood risk content following specification rules

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

// Utility functions for data validation and formatting
const isNullOrUndefined = value => value === null || value === undefined
const isAllowedPair = (impact, likelihood) => VALID_RISK_PAIRS.has(`${impact}-${likelihood}`)

// Build location phrase from source IDs
const buildLocationPhrase = (sourceIds) => {
  const sourceKey = [...sourceIds].sort((a, b) => a - b).join(',')
  return LOCATION_CONTENT[sourceKey] || 'in affected areas'
}

// Capitalize first letter of string
const capitalize = str => (str ? str[0].toUpperCase() + str.slice(1) : str)

// Helper functions for generateOutlookContent processing
// Check if risk matrix contains only zero values
const isMatrixAllZero = (riskMatrixData) =>
  riskMatrixData.every(dayRiskData =>
    Array.isArray(dayRiskData) &&
    dayRiskData.every(sourceRiskPair => Array.isArray(sourceRiskPair) && sourceRiskPair[0] === 0 && sourceRiskPair[1] === 0)
  )

// Process all days in risk matrix
const processAllDays = (riskMatrixData) =>
  riskMatrixData.map((dayRiskMatrix, dayIndex) => {
    const { filteredRiskPairs, hasOnlyVeryLowLikelihood } = processDayRiskData(dayRiskMatrix || [])
    return {
      index: dayIndex,
      filteredRiskPairs,
      hasOnlyVeryLowLikelihood,
      fingerprint: generateDayFingerprint(filteredRiskPairs)
    }
  })

// Group consecutive days with similar risk patterns
const groupConsecutiveDays = (days) => {
  const dayGroupings = []
  for (let start = 0; start < days.length;) {
    let end = start
    while (
      end + 1 < days.length &&
      (
        (days[end + 1].hasOnlyVeryLowLikelihood && days[start].hasOnlyVeryLowLikelihood) ||
        days[end + 1].fingerprint === days[start].fingerprint
      )
    ) {
      end++
    }
    dayGroupings.push({ start, end, days: days.slice(start, end + 1) })
    start = end + 1
  }
  return dayGroupings
}

// Helper function to find the insert position after the last combination with the same impact
function findInsertIndex (chosenCombinations, impactLevel) {
  for (let i = chosenCombinations.length - 1; i >= 0; i--) {
    if (chosenCombinations[i].impact === impactLevel) {
      return i + 1
    }
  }
  return chosenCombinations.length
}

// Select risk combinations for sentence generation
const selectRiskCombinations = (riskCombinations, requiredSentenceCount) => {
  const impactLevelsInPriorityOrder = IMPACT_PRIORITY_ORDER.filter(level =>
    riskCombinations.some(riskCombination => riskCombination.impact === level)
  )

  const impactCombinations = {}
  for (const impactLevel of impactLevelsInPriorityOrder) {
    impactCombinations[impactLevel] = riskCombinations
      .filter(riskCombination => riskCombination.impact === impactLevel)
      .sort((first, second) =>
        LIKELIHOOD_PRIORITY_ORDER.indexOf(first.likelihood) - LIKELIHOOD_PRIORITY_ORDER.indexOf(second.likelihood)
      )
  }

  // Initialize with the highest-likelihood combination for each impact level
  const chosenCombinations = []
  for (const impactLevel of impactLevelsInPriorityOrder) {
    const highestLikelihoodCombination = impactCombinations[impactLevel][0]
    if (highestLikelihoodCombination) {
      chosenCombinations.push(highestLikelihoodCombination)
    }
  }

  // Add additional combinations if more sentences are required
  let impactIndex = 0
  while (chosenCombinations.length < requiredSentenceCount && impactIndex <= MAX_ITERATIONS) {
    const impactLevel = impactLevelsInPriorityOrder[impactIndex % impactLevelsInPriorityOrder.length]
    const availableCombinations = impactCombinations[impactLevel]
    const nextAvailableCombination = availableCombinations.find(riskCombination => !chosenCombinations.includes(riskCombination))
    if (nextAvailableCombination) {
      const insertIndex = findInsertIndex(chosenCombinations, impactLevel)
      chosenCombinations.splice(insertIndex, 0, nextAvailableCombination)
    }
    impactIndex++
  }

  return chosenCombinations
}

// Generate content for a group of days
const generateGroupContent = (group, startDate) => {
  const dayIndices = group.days.map(dayData => dayData.index)
  const label = generateDayLabel(dayIndices, startDate)

  // Special case: all days in group have very low likelihood
  if (group.days.every(dayData => dayData.hasOnlyVeryLowLikelihood)) {
    return { label, sentences: [VERY_LOW_RISK_MESSAGE] }
  }

  // Standard case: process risk pairs for the group
  const groupRiskPairs = group.days[0].filteredRiskPairs
  if (groupRiskPairs.length === 0) {
    return { label, sentences: [VERY_LOW_RISK_MESSAGE] }
  }

  // Categorize risk combinations and determine how many sentences to generate
  const riskCombinations = groupRiskPairsByImpactLikelihood(groupRiskPairs)
  const requiredSentenceCount = Math.min(calculateRequiredSentenceCount(groupRiskPairs), riskCombinations.length)

  const chosenCombinations = selectRiskCombinations(riskCombinations, requiredSentenceCount)

  // Construct human-readable sentences from selected combinations
  const sentences = chosenCombinations.map((riskCombination, index) =>
    index === 0 ? createFirstSentence(riskCombination) : createSubsequentSentence(riskCombination)
  )

  // Combine all sentences into one for the day
  const combinedSentence = sentences.join(' ')

  return { label, sentences: [combinedSentence] }
}

// Generate day labels with special cases
function generateDayLabel (dayIndices, startDate = new Date()) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  if (dayIndices.length === 1) {
    return generateSingleDayLabel(dayIndices[0], startDate, dayNames)
  } else if (dayIndices.length === 2) {
    return generateTwoDayLabel(dayIndices, startDate, dayNames)
  } else {
    return generateMultiDayLabel(dayIndices, startDate, dayNames)
  }
}

// Helper function for single day labels
function generateSingleDayLabel (dayIndex, startDate, dayNames) {
  const targetDate = new Date(startDate)
  targetDate.setUTCDate(startDate.getUTCDate() + dayIndex)

  if (dayIndex === 0) {
    return 'Today'
  }
  if (dayIndex === 1) {
    return 'Tomorrow'
  }
  return dayNames[targetDate.getUTCDay()]
}

// Helper function for two day labels
function generateTwoDayLabel (dayIndices, startDate, dayNames) {
  const [firstDay, lastDay] = dayIndices

  if (firstDay === 0) {
    return 'Today and Tomorrow'
  }

  const firstDate = new Date(startDate)
  firstDate.setUTCDate(startDate.getUTCDate() + firstDay)
  const lastDate = new Date(startDate)
  lastDate.setUTCDate(startDate.getUTCDate() + lastDay)

  const firstDayName = firstDay === 1 ? 'Tomorrow' : dayNames[firstDate.getUTCDay()]
  const lastDayName = dayNames[lastDate.getUTCDay()]

  if (firstDayName === 'Saturday' && lastDayName === 'Sunday') {
    return 'Saturday and Sunday'
  }

  return `${firstDayName} and ${lastDayName}`
}

// Helper function for multiple day labels
function generateMultiDayLabel (dayIndices, startDate, dayNames) {
  const firstDay = dayIndices[0]
  const lastDay = dayIndices[dayIndices.length - 1]

  const firstDate = new Date(startDate)
  firstDate.setUTCDate(startDate.getUTCDate() + firstDay)
  const lastDate = new Date(startDate)
  lastDate.setUTCDate(startDate.getUTCDate() + lastDay)

  const firstDayName = getDayName(firstDay, firstDate, dayNames)
  const lastDayName = dayNames[lastDate.getUTCDay()]

  if (firstDayName === 'Saturday' && lastDayName === 'Monday') {
    return 'Saturday through to Monday'
  }

  return `${firstDayName} through to ${lastDayName}`
}

// Helper function to get day name with special cases
function getDayName (dayIndex, date, dayNames) {
  if (dayIndex === 0) {
    return 'Today'
  }
  if (dayIndex === 1) {
    return 'Tomorrow'
  }
  return dayNames[date.getUTCDay()]
}

// Generate fingerprint for day comparison
function generateDayFingerprint (filteredRiskPairs) {
  const sourceSlots = ['-', '-', '-', '-'] // river, sea, surface, ground
  for (const riskPair of filteredRiskPairs) {
    sourceSlots[riskPair.source] = `${riskPair.impact}-${riskPair.likelihood}`
  }
  return sourceSlots.join('|')
}

// Calculate sentence count based on impacts + likelihoods
function calculateRequiredSentenceCount (riskPairs) {
  const impacts = new Set(riskPairs.map(riskPair => riskPair.impact)).size
  const likelihoods = new Set(riskPairs.map(riskPair => riskPair.likelihood)).size
  const total = impacts + likelihoods
  const SINGLE_SENTENCE = 1
  const DOUBLE_SENTENCES = 2
  const TRIPLE_SENTENCES = 3
  const QUADRUPLE_SENTENCES = 4
  if (total <= ONE_SENTENCE_MAX) {
    return SINGLE_SENTENCE
  }
  if (total >= TWO_SENTENCES_MIN && total <= TWO_SENTENCES_MAX) {
    return DOUBLE_SENTENCES
  }
  if (total === THREE_SENTENCES_TOTAL) {
    return TRIPLE_SENTENCES
  }
  return QUADRUPLE_SENTENCES
}

// Group risk pairs by impact and likelihood, then sort by priority
function groupRiskPairsByImpactLikelihood (filteredRiskPairs) {
  const impactLikelihoodGroups = createImpactLikelihoodGroups(filteredRiskPairs)
  const riskCombinations = convertGroupsToCombinations(impactLikelihoodGroups)
  return sortRiskCombinations(riskCombinations)
}

// Create groups from risk pairs
function createImpactLikelihoodGroups (filteredRiskPairs) {
  const groups = {}
  for (const riskPair of filteredRiskPairs) {
    const key = `${riskPair.impact}-${riskPair.likelihood}`
    if (!groups[key]) {
      groups[key] = { impact: riskPair.impact, likelihood: riskPair.likelihood, sources: [] }
    }
    groups[key].sources.push(riskPair.source)
  }
  return groups
}

// Convert groups to combinations with sorted sources
function convertGroupsToCombinations (impactLikelihoodGroups) {
  return Object.values(impactLikelihoodGroups).map(riskCombination => ({
    impact: riskCombination.impact,
    likelihood: riskCombination.likelihood,
    sources: riskCombination.sources.sort(sortAscending)
  }))
}

// Sort risk combinations by priority order
function sortRiskCombinations (riskCombinations) {
  return riskCombinations.sort((first, second) => {
    // First sort by impact priority
    const impactDiff = IMPACT_PRIORITY_ORDER.indexOf(first.impact) - IMPACT_PRIORITY_ORDER.indexOf(second.impact)
    if (impactDiff !== 0) {
      return impactDiff
    }

    // Then sort by likelihood priority
    const likelihoodDiff = LIKELIHOOD_PRIORITY_ORDER.indexOf(first.likelihood) - LIKELIHOOD_PRIORITY_ORDER.indexOf(second.likelihood)
    if (likelihoodDiff !== 0) {
      return likelihoodDiff
    }

    // Finally sort by first source
    return first.sources[FIRST_SOURCE_INDEX] - second.sources[FIRST_SOURCE_INDEX]
  })
}

// Create first sentence: Impact + Likelihood + Source
const createFirstSentence = ({ impact, likelihood, sources }) =>
  `${IMPACT_CONTENT[impact]} ${LIKELIHOOD_CONTENT[likelihood]} ${buildLocationPhrase(sources)}.`

// Create subsequent sentences: Source + Impact + Likelihood
const createSubsequentSentence = ({ impact, likelihood, sources }) =>
  `${capitalize(buildLocationPhrase(sources))}, ${IMPACT_CONTENT[impact].toLowerCase()} ${LIKELIHOOD_CONTENT[likelihood]}.`

// Process and filter risk data for a single day, removing invalid pairs
function processDayRiskData (dayRiskData) {
  const filteredRiskPairs = []
  let hasVeryLowLikelihood = false

  for (const source of SOURCE_ORDER) {
    const result = processSourceRiskPair(dayRiskData, source)
    if (result.hasVeryLowLikelihood) {
      hasVeryLowLikelihood = true
    }
    if (result.riskPair) {
      filteredRiskPairs.push(result.riskPair)
    }
  }

  return { filteredRiskPairs, hasOnlyVeryLowLikelihood: filteredRiskPairs.length === 0 && hasVeryLowLikelihood }
}

// Process a single source risk pair
function processSourceRiskPair (dayRiskData, source) {
  const sourceRiskPair = dayRiskData?.[source]
  if (!sourceRiskPair || sourceRiskPair.length !== 2) {
    return { hasVeryLowLikelihood: false, riskPair: null }
  }

  const [rawImpactValue, rawLikelihoodValue] = sourceRiskPair
  const impact = isNullOrUndefined(rawImpactValue) ? null : Number(rawImpactValue)
  const likelihood = isNullOrUndefined(rawLikelihoodValue) ? null : Number(rawLikelihoodValue)

  if (likelihood === Likelihood.VeryLow) {
    return { hasVeryLowLikelihood: true, riskPair: null }
  }

  if (isInvalidRiskPair(impact, likelihood)) {
    return { hasVeryLowLikelihood: false, riskPair: null }
  }

  if (isAllowedPair(impact, likelihood)) {
    return { hasVeryLowLikelihood: false, riskPair: { source, impact, likelihood } }
  }

  return { hasVeryLowLikelihood: false, riskPair: null }
}

// Check if a risk pair is invalid
function isInvalidRiskPair (impact, likelihood) {
  return (
    likelihood === Likelihood.None ||
    impact === Impact.None ||
    impact === Impact.Minimal ||
    (likelihood === Likelihood.VeryLow && impact >= Impact.Minor)
  )
}

// Main function to process 5×4×2 risk matrix and generate flood outlook content
function generateOutlookContent (riskMatrixData, startDate = new Date()) {
  if (!Array.isArray(riskMatrixData) || riskMatrixData.length !== DAYS_COUNT) {
    return []
  }

  // Check for all-zero risk matrix (no flood risk)
  if (isMatrixAllZero(riskMatrixData)) {
    return [{ sentences: [VERY_LOW_RISK_MESSAGE] }]
  }

  // Transform raw risk data into processed day objects
  const days = processAllDays(riskMatrixData)

  // Group consecutive days with similar risk patterns
  const dayGroupings = groupConsecutiveDays(days)

  // Generate human-readable content for each day group
  const forecastContent = dayGroupings.map(group => generateGroupContent(group, startDate))

  return forecastContent
}

module.exports = {
  generateOutlookContent
}

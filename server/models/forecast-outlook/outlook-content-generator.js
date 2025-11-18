// 5 Day Forecast (5DF) Content Generator
// Processes 5×4×2 risk matrix: [day][source][impact, likelihood]
//   - 5 days (today + 4 future days)
//   - 4 sources (river, sea, surface water, groundwater)
//   - 2 values per source (impact level + likelihood level)
// Generates human-readable flood risk content following specification rules

const {
  IMPACT,
  LIKELIHOOD,
  VALID_RISK_PAIRS,
  CONFIG,
  CONTENT,
  PRIORITIES,
  PRIORITY_MAP,
  PRIORITY_RANKS
} = require('./outlook-constants')

// Main function to process 5×4×2 risk matrix and generate flood outlook content
// Input: Array of 5 days, each containing 4 sources with [impact, likelihood] pairs
// Output: Array of day groups with human-readable labels and sentences
// Flow: Validate → Check for no-risk → Process days → Group days → Generate content
function generateOutlookContent (riskMatrixData, startDate = new Date()) {
  if (!Array.isArray(riskMatrixData) || riskMatrixData.length !== CONFIG.DAYS_COUNT) {
    return []
  }

  // Check for all-zero risk matrix (no flood risk)
  if (isMatrixAllZero(riskMatrixData)) {
    return [{ sentences: [CONTENT.VERY_LOW_RISK_MESSAGE] }]
  }

  // Transform raw risk data into processed day objects
  const days = processAllDays(riskMatrixData)

  // Group consecutive days with similar risk patterns
  const dayGroupings = groupConsecutiveDays(days)

  // Generate human-readable content for each day group
  const forecastContent = dayGroupings.map(group => generateGroupContent(group, startDate))

  return forecastContent
}

// Helper functions for day processing

// Takes the raw 5-day risk matrix and turns each day into a processed object
// with filtered risk pairs and a fingerprint for grouping similar days
function processAllDays (riskMatrixData) {
  return riskMatrixData.map((dayRiskMatrix, dayIndex) => {
    const { filteredRiskPairs, hasOnlyVeryLowLikelihood } = processDayRiskData(dayRiskMatrix || []) // Passing empty array if dayRiskMatrix is not present for defensive programming
    return {
      index: dayIndex,
      filteredRiskPairs,
      hasOnlyVeryLowLikelihood,
      fingerprint: generateDayFingerprint(filteredRiskPairs)
    }
  })
}

// Processes one day's risk data, filtering out invalid pairs and checking for very low likelihood
function processDayRiskData (dayRiskData) {
  const filteredRiskPairs = []
  let hasVeryLowLikelihood = false

  for (const source of PRIORITIES.SOURCE_ORDER) {
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

// Handles the risk pair for one specific source (like river or sea), validating and filtering it
function processSourceRiskPair (dayRiskData, source) {
  const sourceRiskPair = dayRiskData?.[source]
  if (!sourceRiskPair) {
    return { hasVeryLowLikelihood: false, riskPair: null }
  }

  const [rawImpactValue, rawLikelihoodValue] = sourceRiskPair
  const impact = isNullOrUndefined(rawImpactValue) ? null : Number(rawImpactValue)
  const likelihood = isNullOrUndefined(rawLikelihoodValue) ? null : Number(rawLikelihoodValue)

  if (likelihood === LIKELIHOOD.VeryLow) {
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

// Checks if a risk pair is invalid based on business rules (none values, minimal impact, etc.)
function isInvalidRiskPair (impact, likelihood) {
  return (
    likelihood === LIKELIHOOD.None ||
    impact === IMPACT.None ||
    impact === IMPACT.Minimal ||
    (likelihood === LIKELIHOOD.VeryLow && impact >= IMPACT.Minor)
  )
}

// Creates a string "fingerprint" that represents the risk pattern for a day, used for grouping similar days
function generateDayFingerprint (filteredRiskPairs) {
  const sourceSlots = ['-', '-', '-', '-'] // river, sea, surface, ground
  for (const riskPair of filteredRiskPairs) {
    sourceSlots[riskPair.source] = `${riskPair.impact}-${riskPair.likelihood}`
  }
  return sourceSlots.join('|')
}

// Helper functions for day grouping

// Groups consecutive days that have the same risk pattern or both have very low likelihood
function groupConsecutiveDays (days) {
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

// Helper functions for content generation

// Generates the final human-readable content for a group of days
function generateGroupContent (group, startDate) {
  const dayIndices = group.days.map(dayData => dayData.index)
  const label = generateDayLabel(dayIndices, startDate)

  // Special case: all days in group have very low likelihood
  if (group.days.every(dayData => dayData.hasOnlyVeryLowLikelihood)) {
    return { label, sentences: [CONTENT.VERY_LOW_RISK_MESSAGE] }
  }

  // Standard case: process risk pairs for the group
  const groupRiskPairs = group.days[0].filteredRiskPairs
  if (groupRiskPairs.length === 0) {
    return { label, sentences: [CONTENT.VERY_LOW_RISK_MESSAGE] }
  }

  // Categorize risk combinations and determine how many sentences to generate
  const riskCombinations = groupRiskPairsByImpactLikelihood(groupRiskPairs)
  const requiredSentenceCount = calculateRequiredSentenceCount(groupRiskPairs)
  const chosenCombinations = selectRiskCombinations(riskCombinations, requiredSentenceCount)

  // Construct human-readable sentences from selected combinations
  const sentences = chosenCombinations.map((riskCombination, index) =>
    index === 0 ? createFirstSentence(riskCombination) : createSubsequentSentence(riskCombination)
  )

  // Combine all sentences into one for the day
  const combinedSentence = sentences.join(' ')

  return { label, sentences: [combinedSentence] }
}

// Selects which risk combinations to include in the sentences, prioritizing by combined priority ranking
function selectRiskCombinations (riskCombinations, requiredSentenceCount) {
  if (riskCombinations.length === 0 || requiredSentenceCount === 0) {
    return []
  }

  // Risk combinations are already sorted by priority in sortRiskCombinations
  // Just take the top N based on required sentence count
  const selected = []
  const seenImpactLikelihood = new Set()

  for (const combo of riskCombinations) {
    const key = `${combo.impact}-${combo.likelihood}`

    // Skip duplicates
    if (seenImpactLikelihood.has(key)) {
      continue
    }

    selected.push(combo)
    seenImpactLikelihood.add(key)

    if (selected.length >= requiredSentenceCount) {
      break
    }
  }

  return selected
}

// Decides how many sentences to generate based on the number of unique risk combinations
// Each unique impact+likelihood combination should get its own sentence (up to 4 max)
function calculateRequiredSentenceCount (riskPairs) {
  // Count unique impact+likelihood combinations
  const uniqueCombinations = new Set(riskPairs.map(riskPair => `${riskPair.impact}-${riskPair.likelihood}`)).size

  // Maximum of 4 sentences (one per source at most)
  return Math.min(uniqueCombinations, CONFIG.DAYS_COUNT - 1)
}

// Groups risk pairs by their impact and likelihood levels, combining sources
function groupRiskPairsByImpactLikelihood (filteredRiskPairs) {
  const impactLikelihoodGroups = createImpactLikelihoodGroups(filteredRiskPairs)
  const riskCombinations = convertGroupsToCombinations(impactLikelihoodGroups)
  return sortRiskCombinations(riskCombinations)
}

// Creates groups of risk pairs that share the same impact and likelihood
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

// Turns the groups into combination objects with sorted sources
function convertGroupsToCombinations (impactLikelihoodGroups) {
  return Object.values(impactLikelihoodGroups).map(riskCombination => ({
    impact: riskCombination.impact,
    likelihood: riskCombination.likelihood,
    sources: riskCombination.sources.sort((a, b) => a - b)
  }))
}

// Sorts the combinations by priority: combined impact+likelihood ranking
function sortRiskCombinations (riskCombinations) {
  return riskCombinations.sort((first, second) => {
    const firstKey = `${first.impact}-${first.likelihood}`
    const secondKey = `${second.impact}-${second.likelihood}`
    const firstRank = PRIORITY_MAP.get(firstKey) ?? PRIORITY_RANKS.INVALID
    const secondRank = PRIORITY_MAP.get(secondKey) ?? PRIORITY_RANKS.INVALID

    if (firstRank !== secondRank) {
      return firstRank - secondRank
    }

    // If same priority rank, maintain original source order
    return first.sources[CONFIG.FIRST_SOURCE_INDEX] - second.sources[CONFIG.FIRST_SOURCE_INDEX]
  })
}

// Builds the first sentence of the content, like "Minor flooding is possible from rivers."
function createFirstSentence (riskCombination) {
  const { impact, likelihood, sources } = riskCombination
  return `${CONTENT.IMPACT[impact]} ${CONTENT.LIKELIHOOD[likelihood]} ${buildLocationPhrase(sources)}.`
}

// Builds additional sentences, like "From surface water, minor flooding is possible."
function createSubsequentSentence (riskCombination) {
  const { impact, likelihood, sources } = riskCombination
  return `${capitalize(buildLocationPhrase(sources))}, ${CONTENT.IMPACT[impact].toLowerCase()} ${CONTENT.LIKELIHOOD[likelihood]}.`
}

// Helper functions for day labels

// Creates a readable label for the days, like "Today" or "Monday through Wednesday"
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

// Labels for single days
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

// Labels for two consecutive days
function generateTwoDayLabel (dayIndices, startDate, dayNames) {
  const [firstDay, lastDay] = dayIndices

  if (firstDay === 0) {
    return 'Today and tomorrow'
  }

  const firstDate = new Date(startDate)
  firstDate.setUTCDate(startDate.getUTCDate() + firstDay)
  const lastDate = new Date(startDate)
  lastDate.setUTCDate(startDate.getUTCDate() + lastDay)

  const firstDayName = firstDay === 1 ? 'Tomorrow' : dayNames[firstDate.getUTCDay()]
  const lastDayName = dayNames[lastDate.getUTCDay()]

  return `${firstDayName} and ${lastDayName}`
}

// Labels for three or more days
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

// Gets the day name or special labels like "Today"
function getDayName (dayIndex, date, dayNames) {
  if (dayIndex === 0) {
    return 'Today'
  }
  if (dayIndex === 1) {
    return 'Tomorrow'
  }
  return dayNames[date.getUTCDay()]
}

// Utility functions

// Small helper functions for common checks and string operations
// VALID_RISK_PAIRS: Set of allowed impact-likelihood combinations
// CONFIG: App settings like sentence limits and iteration counts
// CONTENT: Text templates for impacts, likelihoods, and location phrases
// PRIORITIES: Ordering rules for impacts, likelihoods, and sources

const isNullOrUndefined = value => value === null || value === undefined
const isAllowedPair = (impact, likelihood) => VALID_RISK_PAIRS.has(`${impact}-${likelihood}`)

// Turns source IDs into readable location phrases like "from rivers and surface water"
const buildLocationPhrase = (sourceIds) => {
  const sourceKey = [...sourceIds].sort((a, b) => a - b).join(',')
  return CONTENT.LOCATION[sourceKey] || 'in affected areas'
}

const capitalize = str => (str ? str[0].toUpperCase() + str.slice(1) : str)

// Checks if the entire risk matrix has no risk (all zeros)
const isMatrixAllZero = (riskMatrixData) =>
  riskMatrixData.every(dayRiskData =>
    Array.isArray(dayRiskData) &&
    dayRiskData.every(sourceRiskPair => Array.isArray(sourceRiskPair) && sourceRiskPair[0] === 0 && sourceRiskPair[1] === 0)
  )

module.exports = {
  generateOutlookContent
}

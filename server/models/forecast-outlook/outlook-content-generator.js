// 5 Day Forecast (5DF) Content Generator
// Processes 5×4×2 risk matrix: [day][source][impact, likelihood]
// Generates human-readable flood risk content following specification rules

const {
  Impact,
  Likelihood,
  VALID_RISK_PAIRS,
  CONFIG,
  CONTENT,
  PRIORITIES
} = require('./outlook-constants')

// Main function to process 5×4×2 risk matrix and generate flood outlook content
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
function processAllDays (riskMatrixData) {
  return riskMatrixData.map((dayRiskMatrix, dayIndex) => {
    const { filteredRiskPairs, hasOnlyVeryLowLikelihood } = processDayRiskData(dayRiskMatrix || [])
    return {
      index: dayIndex,
      filteredRiskPairs,
      hasOnlyVeryLowLikelihood,
      fingerprint: generateDayFingerprint(filteredRiskPairs)
    }
  })
}

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

function isInvalidRiskPair (impact, likelihood) {
  return (
    likelihood === Likelihood.None ||
    impact === Impact.None ||
    impact === Impact.Minimal ||
    (likelihood === Likelihood.VeryLow && impact >= Impact.Minor)
  )
}

function generateDayFingerprint (filteredRiskPairs) {
  const sourceSlots = ['-', '-', '-', '-'] // river, sea, surface, ground
  for (const riskPair of filteredRiskPairs) {
    sourceSlots[riskPair.source] = `${riskPair.impact}-${riskPair.likelihood}`
  }
  return sourceSlots.join('|')
}

// Helper functions for day grouping
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

function selectRiskCombinations (riskCombinations, requiredSentenceCount) {
  const impactLevelsInPriorityOrder = PRIORITIES.IMPACT_PRIORITY_ORDER.filter(level =>
    riskCombinations.some(riskCombination => riskCombination.impact === level)
  )

  const impactCombinations = {}
  for (const impactLevel of impactLevelsInPriorityOrder) {
    impactCombinations[impactLevel] = riskCombinations
      .filter(riskCombination => riskCombination.impact === impactLevel)
      .sort((first, second) =>
        PRIORITIES.LIKELIHOOD_PRIORITY_ORDER.indexOf(first.likelihood) - PRIORITIES.LIKELIHOOD_PRIORITY_ORDER.indexOf(second.likelihood)
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
  while (chosenCombinations.length < requiredSentenceCount && impactIndex <= CONFIG.MAX_ITERATIONS) {
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

function findInsertIndex (chosenCombinations, impactLevel) {
  for (let i = chosenCombinations.length - 1; i >= 0; i--) {
    if (chosenCombinations[i].impact === impactLevel) {
      return i + 1
    }
  }
  return chosenCombinations.length
}

function calculateRequiredSentenceCount (riskPairs) {
  const impacts = new Set(riskPairs.map(riskPair => riskPair.impact)).size
  const likelihoods = new Set(riskPairs.map(riskPair => riskPair.likelihood)).size
  const total = impacts + likelihoods
  const SINGLE_SENTENCE = 1
  const DOUBLE_SENTENCES = 2
  const TRIPLE_SENTENCES = 3
  const QUADRUPLE_SENTENCES = 4
  if (total <= CONFIG.ONE_SENTENCE_MAX) {
    return SINGLE_SENTENCE
  }
  if (total >= CONFIG.TWO_SENTENCES_MIN && total <= CONFIG.TWO_SENTENCES_MAX) {
    return DOUBLE_SENTENCES
  }
  if (total === CONFIG.THREE_SENTENCES_TOTAL) {
    return TRIPLE_SENTENCES
  }
  return QUADRUPLE_SENTENCES
}

function groupRiskPairsByImpactLikelihood (filteredRiskPairs) {
  const impactLikelihoodGroups = createImpactLikelihoodGroups(filteredRiskPairs)
  const riskCombinations = convertGroupsToCombinations(impactLikelihoodGroups)
  return sortRiskCombinations(riskCombinations)
}

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

function convertGroupsToCombinations (impactLikelihoodGroups) {
  return Object.values(impactLikelihoodGroups).map(riskCombination => ({
    impact: riskCombination.impact,
    likelihood: riskCombination.likelihood,
    sources: riskCombination.sources.sort((a, b) => a - b)
  }))
}

function sortRiskCombinations (riskCombinations) {
  return riskCombinations.sort((first, second) => {
    // First sort by impact priority
    const impactDiff = PRIORITIES.IMPACT_PRIORITY_ORDER.indexOf(first.impact) - PRIORITIES.IMPACT_PRIORITY_ORDER.indexOf(second.impact)
    if (impactDiff !== 0) {
      return impactDiff
    }

    // Then sort by likelihood priority
    const likelihoodDiff = PRIORITIES.LIKELIHOOD_PRIORITY_ORDER.indexOf(first.likelihood) - PRIORITIES.LIKELIHOOD_PRIORITY_ORDER.indexOf(second.likelihood)
    if (likelihoodDiff !== 0) {
      return likelihoodDiff
    }

    // Finally sort by first source
    return first.sources[CONFIG.FIRST_SOURCE_INDEX] - second.sources[CONFIG.FIRST_SOURCE_INDEX]
  })
}

function createFirstSentence (riskCombination) {
  const { impact, likelihood, sources } = riskCombination
  return `${CONTENT.IMPACT[impact]} ${CONTENT.LIKELIHOOD[likelihood]} ${buildLocationPhrase(sources)}.`
}

function createSubsequentSentence (riskCombination) {
  const { impact, likelihood, sources } = riskCombination
  return `${capitalize(buildLocationPhrase(sources))}, ${CONTENT.IMPACT[impact].toLowerCase()} ${CONTENT.LIKELIHOOD[likelihood]}.`
}

// Helper functions for day labels
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
const isNullOrUndefined = value => value === null || value === undefined
const isAllowedPair = (impact, likelihood) => VALID_RISK_PAIRS.has(`${impact}-${likelihood}`)

const buildLocationPhrase = (sourceIds) => { // TODO: write unit test for this function
  const sourceKey = [...sourceIds].sort((a, b) => a - b).join(',')
  return CONTENT.LOCATION[sourceKey] || 'in affected areas'
}

const capitalize = str => (str ? str[0].toUpperCase() + str.slice(1) : str)

const isMatrixAllZero = (riskMatrixData) =>
  riskMatrixData.every(dayRiskData =>
    Array.isArray(dayRiskData) &&
    dayRiskData.every(sourceRiskPair => Array.isArray(sourceRiskPair) && sourceRiskPair[0] === 0 && sourceRiskPair[1] === 0)
  )

module.exports = {
  generateOutlookContent
}

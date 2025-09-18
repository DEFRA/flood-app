function matrixToSentences (matrix, now = new Date()) {
  console.log(matrix)
  // 0) Quick sanity and short-circuit cases
  if (!Array.isArray(matrix) || matrix.length !== 5) {
    // Keep this simple: return a clear structure instead of throwing
    return []
  }

  // If literally everything is [0,0], give a simple 5-day summary
  const allZero = matrix.every(day =>
    Array.isArray(day) &&
    day.every(pair => Array.isArray(pair) && pair[0] === 0 && pair[1] === 0)
  )
  if (allZero) {
    return [{ sentences: ['The flood risk for the next 5 days is very low.'] }]
  }

  // 1) Turn each raw day into a “day object” we can reason about.
  //    (what we kept, whether it’s only very-low, and a fingerprint for grouping)
  const days = matrix.map((oneDay, dayIndex) => {
    const { kept, veryLowOnly } = normaliseDay(oneDay || [])
    return {
      index: dayIndex,
      kept,
      veryLowOnly,
      fingerprint: makeFingerprint(kept)
    }
  })

  // 2) Group consecutive days.
  //    Two days are grouped if:
  //      - both are veryLowOnly, OR
  //      - their fingerprints match exactly.
  const groups = []
  for (let start = 0; start < days.length;) {
    let end = start
    while (
      end + 1 < days.length &&
      (
        (days[end + 1].veryLowOnly && days[start].veryLowOnly) ||
        days[end + 1].fingerprint === days[start].fingerprint
      )
    ) {
      end++
    }
    groups.push({ start, end, days: days.slice(start, end + 1) })
    start = end + 1
  }

  // 3) For each group, render sentences.
  const outputs = []

  for (const group of groups) {
    const label = spanLabel(group.start, group.end, now)

    // Case A: whole group is "very low" → fixed sentence
    if (group.days.every(d => d.veryLowOnly)) {
      outputs.push({ label, sentences: ['The flood risk is very low.'] })
      continue
    }

    // Not “very low”: derive sentences from the (impact, likelihood) kept tuples.
    const keptForThisGroup = group.days[0].kept // groups are identical by definition

    if (keptForThisGroup.length === 0) {
      outputs.push({ label, sentences: ['The flood risk is very low.'] })
      continue
    }

    // 3a) Combine sources that share the same (impact, likelihood)
    const combos = groupByImpactLikelihood(keptForThisGroup)

    // 3b) Decide how many sentences we should output
    const targetCount = Math.min(sentencesNeeded(keptForThisGroup), combos.length)

    // 3c) Choose which combos to narrate:
    //     - ensure at least one combo per distinct impact (from most severe down)
    //     - if more sentences are needed, take the next best likelihoods cycling through impacts
    const distinctImpactsInOrder = IMPACT_DESC.filter(level =>
      combos.some(c => c.impact === level)
    )

    // For each impact, list its combos sorted by likelihood (High → Medium → Low)
    const combosByImpact = {}
    for (const impactLevel of distinctImpactsInOrder) {
      combosByImpact[impactLevel] = combos
        .filter(c => c.impact === impactLevel)
        .sort((a, b) =>
          LIKELIHOOD_DESC.indexOf(a.likelihood) - LIKELIHOOD_DESC.indexOf(b.likelihood)
        )
    }

    // Seed: highest-likelihood combo per impact (in impact severity order)
    const chosen = []
    for (const impactLevel of distinctImpactsInOrder) {
      const first = combosByImpact[impactLevel][0]
      if (first) chosen.push(first)
    }

    // If we still need more, keep cycling through impacts and take the next best likelihood
    let impactCursor = 0
    while (chosen.length < targetCount) {
      const impactLevel = distinctImpactsInOrder[impactCursor % distinctImpactsInOrder.length]
      const list = combosByImpact[impactLevel]
      const next = list.find(c => !chosen.includes(c))
      if (next) {
        // Insert near its impact to keep ordering stable/readable
        chosen.splice(impactCursor, 0, next)
      }
      impactCursor++
      if (impactCursor > 20) break // safety guard
    }

    // 3d) Build sentences:
    //     - first: Impact + Likelihood + Location
    //     - others: Location + Impact + Likelihood
    const sentences = chosen.map((combo, index) =>
      index === 0 ? buildFirstSentence(combo) : buildSubsequentSentence(combo)
    )

    outputs.push({ label, sentences })
  }

  console.log('DEBUG: matrixToSentences outputs:', JSON.stringify(outputs, null, 2))

  return outputs
}

const Source = { River: 0, Sea: 1, Surface: 2, Ground: 3 }
const Impact = { None: 0, Minimal: 1, Minor: 2, Significant: 3, Severe: 4 }
const Likelihood = { None: 0, VeryLow: 1, Low: 2, Medium: 3, High: 4 }

const SOURCE_ORDER = [Source.River, Source.Sea, Source.Surface, Source.Ground]

const IMPACT_TEXT = {
  [Impact.Minor]: 'Localised property flooding and travel disruption',
  [Impact.Significant]: 'Property flooding and significant travel disruption',
  [Impact.Severe]: 'Severe or widespread property flooding and travel disruption'
}

const LIKELIHOOD_TEXT = {
  [Likelihood.Low]: 'is possible',
  [Likelihood.Medium]: 'is likely',
  [Likelihood.High]: 'is expected'
}

const LOCATION_TEXT = {
  0: 'in riverside areas',
  1: 'in coastal areas',
  2: 'in areas at risk from surface water',
  3: 'in areas at risk from groundwater',
  '0,1': 'in riverside and coastal areas',
  '0,2': 'in riverside areas, and areas at risk from surface water',
  '0,3': 'in riverside areas, and areas at risk from groundwater',
  '1,2': 'in coastal areas, and areas at risk from surface water',
  '1,3': 'in coastal areas, and areas at risk from groundwater',
  '2,3': 'in areas at risk from surface water and groundwater',
  '0,1,2': 'in riverside and coastal areas, and areas at risk from surface water',
  '0,1,3': 'in riverside and coastal areas, and areas at risk from groundwater',
  '0,2,3': 'in riverside areas, and areas at risk from surface water and groundwater',
  '1,2,3': 'in coastal areas, and areas at risk from surface water and groundwater',
  '0,1,2,3': 'in riverside and coastal areas, and areas at risk from surface water and groundwater'
}

// Allowed (impact, likelihood) pairs after filtering
const ALLOWED_KEYS = new Set([
  '2-2', '2-3', '2-4',
  '3-2', '3-3', '3-4',
  '4-2', '4-3', '4-4'
])

// Priority orders (highest first)
const IMPACT_DESC = [Impact.Severe, Impact.Significant, Impact.Minor]
const LIKELIHOOD_DESC = [Likelihood.High, Likelihood.Medium, Likelihood.Low]

// --- small helpers that read like English ---
const isNil = v => v === null || v === undefined
const isAllowedPair = (impact, likelihood) => ALLOWED_KEYS.has(`${impact}-${likelihood}`)

const formatLocationPhrase = (sourceIds) => {
  const key = [...sourceIds].sort((a, b) => a - b).join(',')
  return LOCATION_TEXT[key] || ''
}

const capitalize = s => (s ? s[0].toUpperCase() + s.slice(1) : s)

// Human labels for day spans
function dayLabel (offset, now = new Date()) {
  const d = new Date(now)
  d.setDate(d.getDate() + offset)
  if (offset === 0) return 'Today'
  if (offset === 1) return 'Tomorrow'
  return d.toLocaleDateString(undefined, { weekday: 'long' })
}

function spanLabel (startIndex, endIndex, now = new Date()) {
  const start = dayLabel(startIndex, now)
  const end = dayLabel(endIndex, now)
  if (startIndex === endIndex) return start
  if (endIndex === startIndex + 1) return `${start} and ${end}`
  return `${start} through to ${end}`
}

// Make a simple, readable “fingerprint” string for grouping identical days.
// We use 4 slots (river|sea|surface|ground). Missing = “-”.
function makeFingerprint (keptTuples) {
  const slots = ['-', '-', '-', '-'] // river, sea, surface, ground
  for (const t of keptTuples) {
    slots[t.source] = `${t.impact}-${t.likelihood}`
  }
  return slots.join('|')
}

// Decide how many sentences to write from the distinct counts rule.
function sentencesNeeded (pairs) {
  const impacts = new Set(pairs.map(p => p.impact)).size
  const likes = new Set(pairs.map(p => p.likelihood)).size
  const total = impacts + likes
  if (total <= 2) return 1
  if (total === 3 || total === 4) return 2
  if (total === 5) return 3
  return 4
}

// Group all kept tuples by (impact, likelihood) and collect sources.
// Also sort by impact ↓ then likelihood ↓ then source order.
function groupByImpactLikelihood (kept) {
  const bucket = {} // key "impact-likelihood" -> {impact, likelihood, sources[]}
  for (const item of kept) {
    const key = `${item.impact}-${item.likelihood}`
    if (!bucket[key]) bucket[key] = { impact: item.impact, likelihood: item.likelihood, sources: [] }
    bucket[key].sources.push(item.source)
  }
  const combos = Object.values(bucket).map(c => ({
    impact: c.impact,
    likelihood: c.likelihood,
    sources: c.sources.sort((a, b) => a - b)
  }))
  combos.sort((a, b) => {
    if (a.impact !== b.impact) {
      return IMPACT_DESC.indexOf(a.impact) - IMPACT_DESC.indexOf(b.impact)
    }
    if (a.likelihood !== b.likelihood) {
      return LIKELIHOOD_DESC.indexOf(a.likelihood) - LIKELIHOOD_DESC.indexOf(b.likelihood)
    }
    return a.sources[0] - b.sources[0]
  })
  return combos
}

// Sentence builders
const buildFirstSentence = ({ impact, likelihood, sources }) =>
  `${IMPACT_TEXT[impact]} ${LIKELIHOOD_TEXT[likelihood]} ${formatLocationPhrase(sources)}.`

const buildSubsequentSentence = ({ impact, likelihood, sources }) =>
  `${capitalize(formatLocationPhrase(sources))}, ${IMPACT_TEXT[impact].toLowerCase()} ${LIKELIHOOD_TEXT[likelihood]}.`

// Apply the filter rules to one day’s 4 sources.
// Return:
//   kept[]        -> valid tuples ({source, impact, likelihood})
//   veryLowOnly   -> true if the day had only likelihood=1 cases (no kept)
function normaliseDay (dayArray) {
  const kept = []
  let sawVeryLow = false

  for (const source of SOURCE_ORDER) {
    const pair = dayArray?.[source]
    if (!pair || pair.length !== 2) continue

    const [impactRaw, likelihoodRaw] = pair
    const impact = isNil(impactRaw) ? null : Number(impactRaw)
    const likelihood = isNil(likelihoodRaw) ? null : Number(likelihoodRaw)

    // Ignore rules (from spec)
    const ignoreBecause =
      likelihood === Likelihood.None ||
      impact === Impact.None ||
      impact === Impact.Minimal ||
      (likelihood === Likelihood.VeryLow && impact >= Impact.Minor)

    if (likelihood === Likelihood.VeryLow) sawVeryLow = true
    if (ignoreBecause) continue

    if (isAllowedPair(impact, likelihood)) {
      kept.push({ source, impact, likelihood })
    }
  }

  return { kept, veryLowOnly: kept.length === 0 && sawVeryLow }
}

// -----------------------------
// exports
// -----------------------------
module.exports = {
  matrixToSentences,
  // exporting enums helps testing & readability elsewhere
  Source,
  Impact,
  Likelihood
}

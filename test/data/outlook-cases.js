const zeroDay = () => [[0, 0], [0, 0], [0, 0], [0, 0]]

module.exports = [
  // ===== INVALID INPUTS =====
  // Tests for handling malformed or invalid input matrices
  {
    name: 'null matrix returns empty array',
    matrix: null,
    expected: []
  },
  {
    name: 'empty matrix returns empty array',
    matrix: [],
    expected: []
  },
  {
    name: 'incorrect length matrix returns empty array',
    matrix: [zeroDay(), zeroDay()],
    expected: []
  },

  // ===== ALL-ZERO AND VERY LOW SCENARIOS =====
  // Tests for matrices with no risk or very low risk across days
  {
    name: 'severe high risk on first day followed by all-zero days',
    matrix: [
      [[4, 4], [4, 4], [4, 4], [4, 4]], // Day 1: All sources Severe High - tests risk processing and grouping
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]]
    ],
    expected: [
      {
        label: 'Today',
        sentences: ['Severe or widespread property flooding and travel disruption is expected in riverside and coastal areas, and areas at risk from surface water and groundwater.']
      },
      {
        label: 'Tomorrow through to Sunday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },
  {
    name: 'all-zero 5-day matrix returns very low risk summary',
    matrix: [zeroDay(), zeroDay(), zeroDay(), zeroDay(), zeroDay()],
    expected: [
      {
        sentences: ['The flood risk is very low.']
      }
    ]
  },

  // ===== SINGLE SOURCE RISK VARIATIONS =====
  // Tests for different impact and likelihood combinations on a single source
  {
    name: 'single source variations: severe/significant/minor with high/medium/low likelihood',
    now: '2025-09-15T00:00:00Z',
    matrix: [
      [[4, 4], [0, 0], [0, 0], [0, 0]], // Day 1: River Severe High
      [[4, 3], [0, 0], [0, 0], [0, 0]], // Day 2: River Severe Medium
      [[4, 2], [0, 0], [0, 0], [0, 0]], // Day 3: River Severe Low
      [[3, 4], [0, 0], [0, 0], [0, 0]], // Day 4: River Significant High
      [[3, 3], [0, 0], [0, 0], [0, 0]] // Day 5: River Significant Medium
    ],
    expected: [
      {
        label: 'Today',
        sentences: [
          'Severe or widespread property flooding and travel disruption is expected in riverside areas.'
        ]
      },
      {
        label: 'Tomorrow',
        sentences: [
          'Severe or widespread property flooding and travel disruption is likely in riverside areas.'
        ]
      },
      {
        label: 'Wednesday',
        sentences: [
          'Severe or widespread property flooding and travel disruption is possible in riverside areas.'
        ]
      },
      {
        label: 'Thursday',
        sentences: [
          'Property flooding and significant travel disruption is expected in riverside areas.'
        ]
      },
      {
        label: 'Friday',
        sentences: [
          'Property flooding and significant travel disruption is likely in riverside areas.'
        ]
      }
    ]
  },
  {
    name: 'single source variations: significant low, minor high/medium/low likelihood',
    now: '2025-09-15T00:00:00Z',
    matrix: [
      [[3, 2], [0, 0], [0, 0], [0, 0]], // Day 1: River Significant Low
      [[2, 4], [0, 0], [0, 0], [0, 0]], // Day 2: River Minor High
      [[2, 3], [0, 0], [0, 0], [0, 0]], // Day 3: River Minor Medium
      [[2, 2], [0, 0], [0, 0], [0, 0]], // Day 4: River Minor Low
      zeroDay() // Day 5: Zero
    ],
    expected: [
      {
        label: 'Today',
        sentences: [
          'Property flooding and significant travel disruption is possible in riverside areas.'
        ]
      },
      {
        label: 'Tomorrow',
        sentences: [
          'Localised property flooding and travel disruption is expected in riverside areas.'
        ]
      },
      {
        label: 'Wednesday',
        sentences: [
          'Localised property flooding and travel disruption is likely in riverside areas.'
        ]
      },
      {
        label: 'Thursday',
        sentences: [
          'Localised property flooding and travel disruption is possible in riverside areas.'
        ]
      },
      {
        label: 'Friday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },
  {
    name: 'invalid risk pairs result in very low risk',
    now: '2025-09-15T00:00:00Z',
    matrix: [
      [[1, 3], [2, 1], [2, 0], [0, 3]], // Day 1: Invalid pairs - Minimal Medium, Minor VeryLow, Minor None, None Medium
      zeroDay(),
      zeroDay(),
      zeroDay(),
      zeroDay()
    ],
    expected: [
      {
        label: 'Today through to Friday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },

  // ===== MULTIPLE SOURCES WITH SAME RISK =====
  // Tests for multiple sources having the same risk level
  {
    name: 'two sources with significant impact medium likelihood',
    now: '2025-09-16T00:00:00Z',
    matrix: [
      [[3, 3], [0, 0], [3, 3], [0, 0]], // River and Surface: Significant Medium
      zeroDay(),
      zeroDay(),
      zeroDay(),
      zeroDay()
    ],
    expected: [
      {
        label: 'Today',
        sentences: [
          'Property flooding and significant travel disruption is likely in riverside areas, and areas at risk from surface water.'
        ]
      },
      {
        label: 'Tomorrow through to Saturday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },
  {
    name: 'three sources with minor impact medium likelihood',
    now: '2025-09-17T00:00:00Z',
    matrix: [
      [[2, 3], [2, 3], [0, 0], [2, 3]], // River, Sea, Ground: Minor Medium
      zeroDay(),
      zeroDay(),
      zeroDay(),
      zeroDay()
    ],
    expected: [
      {
        label: 'Today',
        sentences: [
          'Localised property flooding and travel disruption is likely in riverside and coastal areas, and areas at risk from groundwater.'
        ]
      },
      {
        label: 'Tomorrow through to Sunday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },

  // ===== DAY GROUPING AND VERY LOW FALLBACKS =====
  // Tests for how consecutive days with similar risks are grouped
  {
    name: 'day grouping: risk day followed by consecutive very low days',
    now: '2025-09-18T00:00:00Z',
    matrix: [
      [[2, 4], [0, 0], [0, 0], [0, 0]], // Today: Minor High
      [[0, 1], [0, 0], [0, 0], [0, 0]], // Very Low
      [[0, 1], [0, 0], [0, 0], [0, 0]], // Very Low
      [[0, 1], [0, 0], [0, 0], [0, 0]], // Very Low
      zeroDay() // Zero
    ],
    expected: [
      {
        label: 'Today',
        sentences: [
          'Localised property flooding and travel disruption is expected in riverside areas.'
        ]
      },
      {
        label: 'Tomorrow through to Monday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },
  {
    name: 'fallback to very low: risk day followed by consecutive zero days',
    now: '2025-09-19T00:00:00Z',
    matrix: [
      [[2, 4], [0, 0], [0, 0], [0, 0]], // Today: Minor High
      zeroDay(),
      zeroDay(),
      zeroDay(),
      zeroDay()
    ],
    expected: [
      {
        label: 'Today',
        sentences: [
          'Localised property flooding and travel disruption is expected in riverside areas.'
        ]
      },
      {
        label: 'Tomorrow through to Tuesday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },

  // ===== MIXED DAILY RISKS =====
  // Tests for days with multiple different risks or sources
  {
    name: 'mixed impacts on same day: minor high and significant medium',
    now: '2025-09-20T00:00:00Z',
    matrix: [
      [[2, 4], [3, 3], [0, 0], [0, 0]], // Today: River Minor High, Sea Significant Medium
      zeroDay(),
      zeroDay(),
      zeroDay(),
      zeroDay()
    ],
    expected: [
      {
        label: 'Today',
        sentences: [
          'Property flooding and significant travel disruption is likely in coastal areas. In riverside areas, localised property flooding and travel disruption is expected.'
        ]
      },
      {
        label: 'Tomorrow through to Wednesday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },
  {
    name: 'mixed likelihoods on same day: severe medium and severe low',
    now: '2025-09-19T10:00:00Z',
    matrix: [
      [[0, 1], [0, 0], [0, 0], [0, 0]], // Very Low
      [[0, 1], [0, 0], [0, 0], [0, 0]], // Very Low
      [[0, 1], [0, 0], [0, 0], [0, 0]], // Very Low
      [[0, 1], [0, 0], [0, 0], [0, 0]], // Very Low
      [[0, 0], [4, 3], [0, 0], [4, 2]] // Sea Severe Medium, Ground Severe Low
    ],
    expected: [
      {
        label: 'Today through to Monday',
        sentences: ['The flood risk is very low.']
      },
      {
        label: 'Tuesday',
        sentences: [
          'Severe or widespread property flooding and travel disruption is likely in coastal areas. In areas at risk from groundwater, severe or widespread property flooding and travel disruption is possible.'
        ]
      }
    ]
  },
  {
    name: 'comprehensive mixed scenario with day grouping',
    now: '2025-09-19T00:00:00Z', // Friday start for weekend labeling
    matrix: [
      [[4, 4], [3, 3], [0, 0], [0, 0]], // Day 1: River Severe High, Sea Significant Medium
      [[4, 4], [4, 3], [0, 0], [0, 0]], // Day 2: Same as Day 1 (should group)
      [[2, 2], [4, 2], [4, 2], [4, 2]], // Day 3: River Minor Low, Surface Severe Low, Ground Severe Low
      [[0, 1], [0, 0], [0, 0], [0, 0]], // Day 4: Very Low
      zeroDay() // Day 5: Zero
    ],
    expected: [
      {
        label: 'Today',
        sentences: [
          'Severe or widespread property flooding and travel disruption is expected in riverside areas. In coastal areas, property flooding and significant travel disruption is likely.'
        ]
      },
      {
        label: 'Tomorrow',
        sentences: [
          'Severe or widespread property flooding and travel disruption is expected in riverside areas. In coastal areas, severe or widespread property flooding and travel disruption is likely.'
        ]
      },
      {
        label: 'Sunday',
        sentences: [
          'Severe or widespread property flooding and travel disruption is possible in coastal areas, and areas at risk from surface water and groundwater. In riverside areas, localised property flooding and travel disruption is possible.'
        ]
      },
      {
        label: 'Monday and Tuesday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },
  {
    name: 'edge case: invalid pairs, boundary dates, and max combinations',
    now: '2025-09-20T00:00:00Z', // Saturday start for weekend labeling
    matrix: [
      [[1, 3], [2, 1], [2, 0], [0, 3]], // Day 1: Invalid pairs - all filtered out to very low
      [[4, 4], [4, 3], [4, 2], [3, 3]], // Day 2: All 4 sources with different impacts/likelihoods
      [[4, 4], [4, 3], [4, 2], [3, 3]], // Day 3: Same as Day 2 (should group)
      [[0, 1], [0, 0], [0, 0], [0, 0]], // Day 4: Very Low
      zeroDay() // Day 5: Zero
    ],
    expected: [
      {
        label: 'Today',
        sentences: ['The flood risk is very low.']
      },
      {
        label: 'Tomorrow and Monday',
        sentences: [
          'Severe or widespread property flooding and travel disruption is expected in riverside areas. In coastal areas, severe or widespread property flooding and travel disruption is likely. In areas at risk from groundwater, property flooding and significant travel disruption is likely.'
        ]
      },
      {
        label: 'Tuesday and Wednesday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },

  // ===== LOCATION PHRASE BUILDING =====
  // Tests for how location phrases are constructed from multiple sources
  {
    name: 'buildLocationPhrase with multiple sources: riverside, surface, ground',
    matrix: [
      [[3, 3], [0, 0], [3, 3], [3, 3]], // Day 1: River, Surface, Ground all Significant Medium
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]]
    ],
    expected: [
      {
        label: 'Today',
        sentences: ['Property flooding and significant travel disruption is likely in riverside areas, and areas at risk from surface water and groundwater.']
      },
      {
        label: 'Tomorrow through to Sunday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },

  // ===== ADDITIONAL COVERAGE TESTS =====
  // Tests for edge cases and code coverage
  {
    name: 'null/undefined impact and likelihood values handling',
    matrix: [
      [[null, 3], [3, null], [undefined, 2], [2, undefined]], // Day 1: Mixed null/undefined values
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]]
    ],
    expected: [
      {
        label: 'Today through to Sunday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },
  {
    name: 'valid risk pairs to exercise isAllowedPair check',
    matrix: [
      [[2, 2], [3, 3], [4, 4], [0, 0]], // Day 1: Valid pairs for all sources
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]]
    ],
    expected: [
      {
        label: 'Today',
        sentences: ['Severe or widespread property flooding and travel disruption is expected in areas at risk from surface water. In coastal areas, property flooding and significant travel disruption is likely. In riverside areas, localised property flooding and travel disruption is possible.']
      },
      {
        label: 'Tomorrow through to Sunday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },
  {
    name: 'invalid risk pairs result in very low risk (isInvalidRiskPair coverage)',
    matrix: [
      [[1, 3], [0, 0], [2, 1], [0, 0]], // Day 1: Minimal impact (invalid), Minor VeryLow (invalid)
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]]
    ],
    expected: [
      {
        label: 'Today through to Sunday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },
  {
    name: 'all sources with severe high risk (highestLikelihoodCombination coverage)',
    matrix: [
      [[4, 4], [4, 4], [4, 4], [4, 4]], // Day 1: All sources Severe High
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]]
    ],
    expected: [
      {
        label: 'Today',
        sentences: ['Severe or widespread property flooding and travel disruption is expected in riverside and coastal areas, and areas at risk from surface water and groundwater.']
      },
      {
        label: 'Tomorrow through to Sunday',
        sentences: ['The flood risk is very low.']
      }
    ]
  }
]

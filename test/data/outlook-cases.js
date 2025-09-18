const zeroDay = () => [[0, 0], [0, 0], [0, 0], [0, 0]]

module.exports = [
  // Test invalid inputs
  {
    name: 'invalid matrix → []',
    matrix: null,
    expected: []
  },
  {
    name: 'empty array → []',
    matrix: [],
    expected: []
  },
  {
    name: 'wrong length matrix → []',
    matrix: [zeroDay(), zeroDay()],
    expected: []
  },

  // Test all-zero scenarios
  {
    name: 'all-zero 5-day matrix → single very-low summary',
    matrix: [zeroDay(), zeroDay(), zeroDay(), zeroDay(), zeroDay()],
    expected: [
      {
        sentences: ['The flood risk is very low.']
      }
    ]
  },

  // Test single day risks
  {
    name: 'severe impact with high likelihood',
    now: '2025-01-01T00:00:00Z',
    matrix: [
      [[4, 4], [0, 0], [0, 0], [0, 0]], // Severe, High for river
      zeroDay(),
      zeroDay(),
      zeroDay(),
      zeroDay()
    ],
    expected: [
      {
        label: 'Today',
        sentences: [
          'Severe or widespread property flooding and travel disruption is expected in riverside areas.'
        ]
      },
      {
        label: 'Tomorrow through to Sunday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },

  // Test multiple sources
  {
    name: 'combine sources with same risk into one sentence',
    now: '2025-01-01T00:00:00Z',
    matrix: [
      [[3, 3], [0, 0], [3, 3], [0, 0]], // Significant, Medium for river and surface
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
        label: 'Tomorrow through to Sunday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },
  {
    name: 'multiple sources including sea and ground',
    now: '2025-01-01T00:00:00Z',
    matrix: [
      [[2, 3], [2, 3], [0, 0], [2, 3]], // Minor, Medium for river, sea, ground
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

  // Test day grouping and fallbacks
  {
    name: 'today has risk then 3 "very low" days (grouped) (plus final zero day treated as very low)',
    now: '2025-01-01T00:00:00Z',
    matrix: [
      [[2, 4], [0, 0], [0, 0], [0, 0]], // Minor, High
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
        label: 'Tomorrow through to Sunday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },
  {
    name: 'empty-kept fallback: tomorrow..Sunday becomes very low',
    now: '2025-01-01T00:00:00Z',
    matrix: [
      [[2, 4], [0, 0], [0, 0], [0, 0]], // Today has content
      zeroDay(), // Fallback to very low
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
        label: 'Tomorrow through to Sunday',
        sentences: ['The flood risk is very low.']
      }
    ]
  },

  // Test mixed daily risks
  {
    name: 'mixed risks on different days',
    now: '2025-01-01T00:00:00Z',
    matrix: [
      [[2, 4], [0, 0], [0, 0], [0, 0]], // Today: Minor, High
      [[3, 3], [0, 0], [0, 0], [0, 0]], // Tomorrow: Significant, Medium
      [[0, 1], [0, 0], [0, 0], [0, 0]], // Friday: Very Low
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
        label: 'Tomorrow',
        sentences: [
          'Property flooding and significant travel disruption is likely in riverside areas.'
        ]
      },
      {
        label: 'Friday through to Sunday',
        sentences: ['The flood risk is very low.']
      }
    ]
  }
]

const zeroDay = () => [[0, 0], [0, 0], [0, 0], [0, 0]]

module.exports = [
  {
    name: 'invalid matrix → []',
    matrix: null,
    expected: []
  },

  {
    name: 'all-zero 5-day matrix → single very-low summary',
    matrix: [zeroDay(), zeroDay(), zeroDay(), zeroDay(), zeroDay()],
    expected: [
      {
        sentences: ['The flood risk for the next 5 days is very low.']
      }
    ]
  },

  {
    name: 'today has risk then 3 "very low" days (grouped) (plus final zero day treated as very low)',
    now: '2025-01-01T00:00:00Z',
    matrix: [
      [[2, 4], [0, 0], [0, 0], [0, 0]],
      [[0, 1], [0, 0], [0, 0], [0, 0]],
      [[0, 1], [0, 0], [0, 0], [0, 0]],
      [[0, 1], [0, 0], [0, 0], [0, 0]],
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

  {
    name: 'empty-kept fallback: tomorrow..Sunday becomes very low',
    now: '2025-01-01T00:00:00Z',
    matrix: [
      [[2, 4], [0, 0], [0, 0], [0, 0]], // Today has content
      zeroDay(), // no kept → fallback very low
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

  {
    name: 'combine sources with same risk into one sentence',
    now: '2025-01-01T00:00:00Z',
    matrix: [
      [[3, 3], [0, 0], [3, 3], [0, 0]], // river + surface both (Significant, Medium)
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
  }
]

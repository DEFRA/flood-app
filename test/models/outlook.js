'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const sinon = require('sinon')
const OutlookMap = require('../../server/models/outlook-map')

describe('Model - Outlook', () => {
  let sandbox

  const outlookFakeData = {
    id: 1107,
    issued_at: '2019-08-08T09:30:00Z',
    pdf_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01107-2019-08-08_1030/fgs.pdf',
    detailed_csv_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01107-2019-08-08_1030/detailed.csv',
    area_of_concern_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01107-2019-08-08_1030/areaofconcern.jpg',
    flood_risk_trend:
    {
      day1: 'stable',
      day2: 'stable',
      day3: 'stable',
      day4: 'increasing',
      day5: 'increasing'
    },
    sources:
      [{ surface: 'The surface water flood risk is LOW.\n\nSignificant surface water flooding impacts are possible but not expected across many parts of England and Wales on Friday due to widespread rain and heavy showers. Significant surface water flooding impacts are possible but not expected from thunderstorms on Saturday and Sunday across parts of the north of England.\n\nMinor surface water flooding impacts are possible but not expected from heavy showers on Monday across parts of the north of England and Wales.' },
        { river: 'The river flood risk is LOW.\n\nSignificant river flooding impacts are possible but not expected across parts of the north Midlands and the north of England on Friday due to widespread rain and heavy showers. Significant river flooding impacts are possible but not expected from thunderstorms on Saturday and Sunday across parts of the north of England. Urban watercourses and small, fast responding river catchments are most at risk.\n\nMinor river flooding impacts are possible but not expected from heavy showers on Monday across parts of the north of England and Wales.\n\nThe ongoing situation at Toddbrook Reservoir is being managed by the relevant agencies to minimise the risk of flooding and has not been specifically shown on this product.' },
        { coastal: 'The coastal/tidal flood risk is VERY LOW for the next five days.' },
        { ground: 'The groundwater flood risk is VERY LOW for the next five days.' }],
    headline: 'Significant surface water and river flooding impacts are possible but not expected across parts of England and Wales on Friday, and across parts of the north of England on Saturday and Sunday. The overall flood risk is LOW.',
    amendments: '',
    future_forecast: '',
    last_modified_at: '2019-08-08T09:27:22Z',
    next_issue_due_at: '2019-08-09T09:30:00Z',
    png_thumbnails_with_days_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01107-2019-08-08_1030/FGSthumbnails-with-days.png',
    risk_areas:
      [{
        id: 1950,
        statement_id: 1105,
        updated_at: '2019-08-06T09:22:29Z',
        beyond_five_days: false,
        ordering: 2,
        risk_area_blocks: [
          {
            id: 2035,
            days: [5],
            risk_area_id: 1950,
            risk_levels: {
              river: [2, 2],
              surface: [2, 2],
              coastal: [2, 2]
            },
            additional_information: 'Heavy thundery showers. Urban areas and small catchments most at risk.',
            polys:
              [
                {
                  id: 2660,
                  coordinates:
                    [
                      [
                        [-4.174804687500001, 54.625522440842246],
                        [-3.146484643220902, 54.96247882239579],
                        [-2.531250268220902, 55.36412729483159],
                        [-2.3994143307209015, 55.65031856976615],
                        [-1.9599612057209017, 55.90980992336868],
                        [0.47141432762146, 53.83838539206968],
                        [0.21972656250000003, 53.32848623940286],
                        [-4.630237072706223, 53.13119286673744],
                        [-4.174804687500001, 54.625522440842246]
                      ]
                    ],
                  area: 8.42310580332646,
                  label_position: [-2.08465592935681, 54.1276207351252],
                  poly_type: 'inland',
                  risk_area_block_id: 2035,
                  counties: [
                    {
                      name: 'Lincolnshire'
                    }
                  ]
                }
              ]
          }
        ]
      }
      ],
    aoc_maps:
      [{
        id: 1183,
        title: 'Specific Areas of Concern Map 3 - Sunday 11 August',
        ordering: 2,
        caption: '',
        ratio: [Array],
        statement_id: 1107,
        polys: [Array]
      }],
    public_forecast:
    {
      id: 1107,
      england_forecast: 'Local flooding from surface water and rivers is possible but not expected in places across much of the north of England on Friday due to widespread rain and heavy showers. Local flooding from rivers is possible, and flooding from surface water possible but not expected, across Wales and much of central and southern England on Friday.\n\nFurther local flooding from surface water and rivers is possible but not expected on Saturday and Sunday in parts of northern England due to heavy, thundery showers.\n\nLocal minor river and surface water flooding impacts are possible but not expected in parts of the north of England on Monday.\n\nProperties may flood and there may be travel disruption.',
      welsh_forecast: 'Mae llifogydd lleol o ddŵr wyneb ac afonydd yn bosibl ond nid yn ddisgwyliedig mewn mannau ar draws rhan fwyaf o ogledd Lloegr ar ddydd Gwener, o ganlyniad i law eang a chawodydd trwm. Mae llifogydd lleol o afonydd yn bosibl, a llifogydd o ddŵr wyneb yn bosibl ond heb eu disgwyl, ar draws Cymru a llawer o Ganolbarth a De Lloegr ar ddydd Gwener.\n\nMae\'n bosibl bydd llifogydd lleol pellach o ddŵr wyneb ac afonydd, ond heb eu disgwyl, ar ddydd Sadwrn a dydd Sul mewn rhannau o ogledd Lloegr oherwydd cawodydd trwm a stormydd. \n\nBydd siawns o effaith lifogydd o afonydd a dwr wyneb lleol mewn rhannau o Ogledd Lloegr ar Ddydd Llun ond nid yw hyn yn ddisgwyliedig. \n\nGall eiddo orlifo ac mae \'n bosibl y bydd tarfu ar deithio.',
      english_forecast: 'Service not available.',
      wales_forecast_english: 'Service not available.',
      wales_forecast_welsh: 'Service not available.',
      published_at: '2019-08-08T11:06:48Z'
    }
  }

  beforeEach(async () => {
    sandbox = await sinon.createSandbox()
  })

  afterEach(async () => {
    await sandbox.restore()
  })

  it('should return outlook data', () => {
    const outlook = new OutlookMap(outlookFakeData)

    expect(JSON.stringify(outlook.issueDate)).to.be.equal('"2019-08-08T09:30:00.000Z"')
    expect(outlook.timestampOutlook).to.be.equal(1565256600000)
    expect(outlook.hasOutlookConcern).to.be.equal(true)
    expect(outlook.riskLevels).to.be.equal([0, 0, 0, 0, 1])
    expect(outlook.days[0].idx).to.be.equal(1)
    expect(outlook.days[0].level).to.be.equal(0)
  })

  it('should condense multiple lines to single', () => {
    const outlook = new OutlookMap(outlookFakeData)

    const fullOutput = [
      'Local flooding from surface water and rivers is possible but not expected in places across much of the north of England on Friday due to widespread rain and heavy showers. Local flooding from rivers is possible, and flooding from surface water possible but not expected, across Wales and much of central and southern England on Friday.',
      'Further local flooding from surface water and rivers is possible but not expected on Saturday and Sunday in parts of northern England due to heavy, thundery showers.',
      'Local minor river and surface water flooding impacts are possible but not expected in parts of the north of England on Monday.',
      'Properties may flood and there may be travel disruption.'
    ]

    expect(outlook.full).to.be.equal(fullOutput)
  })

  it('should set "hasOutlookConcern" to false', () => {
    const outlookFakeData2 = {
      id: 1107,
      issued_at: '2019-08-08T09:30:00Z',
      pdf_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01107-2019-08-08_1030/fgs.pdf',
      detailed_csv_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01107-2019-08-08_1030/detailed.csv',
      area_of_concern_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01107-2019-08-08_1030/areaofconcern.jpg',
      flood_risk_trend:
      {
        day1: 'stable',
        day2: 'stable',
        day3: 'stable',
        day4: 'increasing',
        day5: 'increasing'
      },
      sources:
        [{ surface: 'The surface water flood risk is LOW.\n\nSignificant surface water flooding impacts are possible but not expected across many parts of England and Wales on Friday due to widespread rain and heavy showers. Significant surface water flooding impacts are possible but not expected from thunderstorms on Saturday and Sunday across parts of the north of England.\n\nMinor surface water flooding impacts are possible but not expected from heavy showers on Monday across parts of the north of England and Wales.' },
          { river: 'The river flood risk is LOW.\n\nSignificant river flooding impacts are possible but not expected across parts of the north Midlands and the north of England on Friday due to widespread rain and heavy showers. Significant river flooding impacts are possible but not expected from thunderstorms on Saturday and Sunday across parts of the north of England. Urban watercourses and small, fast responding river catchments are most at risk.\n\nMinor river flooding impacts are possible but not expected from heavy showers on Monday across parts of the north of England and Wales.\n\nThe ongoing situation at Toddbrook Reservoir is being managed by the relevant agencies to minimise the risk of flooding and has not been specifically shown on this product.' },
          { coastal: 'The coastal/tidal flood risk is VERY LOW for the next five days.' },
          { ground: 'The groundwater flood risk is VERY LOW for the next five days.' }],
      headline: 'Significant surface water and river flooding impacts are possible but not expected across parts of England and Wales on Friday, and across parts of the north of England on Saturday and Sunday. The overall flood risk is LOW.',
      amendments: '',
      future_forecast: '',
      last_modified_at: '2019-08-08T09:27:22Z',
      next_issue_due_at: '2019-08-09T09:30:00Z',
      png_thumbnails_with_days_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01107-2019-08-08_1030/FGSthumbnails-with-days.png',
      risk_areas:
        [{
          id: 1950,
          statement_id: 1105,
          updated_at: '2019-08-06T09:22:29Z',
          beyond_five_days: false,
          ordering: 2,
          risk_area_blocks: [
            {
              id: 2035,
              days: [5],
              risk_area_id: 1950,
              risk_levels: {},
              additional_information: 'Heavy thundery showers. Urban areas and small catchments most at risk.',
              polys:
                [
                  {
                    id: 2660,
                    coordinates:
                      [
                        [
                          [-4.174804687500001, 54.625522440842246],
                          [-3.146484643220902, 54.96247882239579],
                          [-2.531250268220902, 55.36412729483159],
                          [-2.3994143307209015, 55.65031856976615],
                          [-1.9599612057209017, 55.90980992336868],
                          [0.47141432762146, 53.83838539206968],
                          [0.21972656250000003, 53.32848623940286],
                          [-4.630237072706223, 53.13119286673744],
                          [-4.174804687500001, 54.625522440842246]
                        ]
                      ],
                    area: 8.42310580332646,
                    label_position: [-2.08465592935681, 54.1276207351252],
                    poly_type: 'inland',
                    risk_area_block_id: 2035,
                    counties: [
                      {
                        name: 'Lincolnshire'
                      }
                    ]
                  }
                ]
            }
          ]
        }
        ],
      aoc_maps:
        [{
          id: 1183,
          title: 'Specific Areas of Concern Map 3 - Sunday 11 August',
          ordering: 2,
          caption: '',
          ratio: [Array],
          statement_id: 1107,
          polys: [Array]
        }],
      public_forecast:
      {
        id: 1107,
        england_forecast: 'Local flooding from surface water and rivers is possible but not expected in places across much of the north of England on Friday due to widespread rain and heavy showers. Local flooding from rivers is possible, and flooding from surface water possible but not expected, across Wales and much of central and southern England on Friday.\n\nFurther local flooding from surface water and rivers is possible but not expected on Saturday and Sunday in parts of northern England due to heavy, thundery showers.\n\nLocal minor river and surface water flooding impacts are possible but not expected in parts of the north of England on Monday.\n\nProperties may flood and there may be travel disruption.',
        welsh_forecast: 'Mae llifogydd lleol o ddŵr wyneb ac afonydd yn bosibl ond nid yn ddisgwyliedig mewn mannau ar draws rhan fwyaf o ogledd Lloegr ar ddydd Gwener, o ganlyniad i law eang a chawodydd trwm. Mae llifogydd lleol o afonydd yn bosibl, a llifogydd o ddŵr wyneb yn bosibl ond heb eu disgwyl, ar draws Cymru a llawer o Ganolbarth a De Lloegr ar ddydd Gwener.\n\nMae\'n bosibl bydd llifogydd lleol pellach o ddŵr wyneb ac afonydd, ond heb eu disgwyl, ar ddydd Sadwrn a dydd Sul mewn rhannau o ogledd Lloegr oherwydd cawodydd trwm a stormydd. \n\nBydd siawns o effaith lifogydd o afonydd a dwr wyneb lleol mewn rhannau o Ogledd Lloegr ar Ddydd Llun ond nid yw hyn yn ddisgwyliedig. \n\nGall eiddo orlifo ac mae \'n bosibl y bydd tarfu ar deithio.',
        english_forecast: 'Service not available.',
        wales_forecast_english: 'Service not available.',
        wales_forecast_welsh: 'Service not available.',
        published_at: '2019-08-08T11:06:48Z'
      }
    }

    const outlook = new OutlookMap(outlookFakeData2)

    expect(outlook._hasOutlookConcern).to.be.equal(false)
  })

  it('should convert coastal area (linestring) to a polygon', () => {
    const outlookWithCoastal = {
      id: 1830,
      issued_at: '2021-04-06T09:30:00Z',
      pdf_url: 'fgs.pdf',
      detailed_csv_url: 'detailed.csv',
      area_of_concern_url: 'areaofconcern.jpg',
      flood_risk_trend: { day1: 'stable', day2: 'stable', day3: 'stable', day4: 'stable', day5: 'stable' },
      sources: [{ river: 'The river flood risk is VERY LOW' },
        { coastal: 'The coastal/tidal flood risk is VERY LOW' },
        { ground: 'The groundwater flood risk is VERY LOW' },
        { surface: 'The surface water flood risk is VERY LOW' }
      ],
      headline: 'Minor river flooding is possible in north-west England.',
      amendments: '',
      future_forecast: '',
      last_modified_at: '2021-03-29T09:18:29Z',
      next_issue_due_at: '2021-03-30T09:30:00Z',
      png_thumbnails_with_days_url: 'fgs-statements/01830-2021-03-29_1030/FGSthumbnails-with-days.png',
      risk_areas: [
        {
          id: 5620,
          statement_id: 1830,
          updated_at: '2021-03-29T08:39:06Z',
          beyond_five_days: false,
          ordering: 1,
          risk_area_blocks: [
            {
              id: 6377,
              days: [1, 2, 3],
              risk_area_id: 5620,
              risk_levels: { coastal: [2, 2] },
              additional_information: 'Minor coastal impacts possible from Monday to Wednesday.',
              polys: [
                {
                  id: 8354,
                  coordinates: [
                    [-0.78842, 54.56071], [-0.74844, 54.53164], [-0.73943, 54.52731], [-0.7148, 54.53348], [-0.68459, 54.52018], [-0.67077, 54.50035], [-0.63395, 54.49637], [-0.58854, 54.48926], [-0.55361, 54.46704], [-0.52146, 54.44695], [-0.5327, 54.43324], [-0.52277, 54.41626], [-0.46368, 54.38917], [-0.44546, 54.36013], [-0.43267, 54.34018], [-0.41704, 54.33145], [-0.40748, 54.29391], [-0.38477, 54.28805], [-0.39653, 54.27424], [-0.36949, 54.24931], [-0.36597, 54.25389], [-0.31912, 54.23388], [-0.27708, 54.21728], [-0.26327, 54.1759], [-0.21253, 54.15757], [-0.15209, 54.14283], [-0.09374, 54.12838], [-0.07638, 54.11641], [-0.16796, 54.09833], [-0.19841, 54.0779], [-0.21192, 54.00732], [-0.18608, 53.95669], [-0.15636, 53.90467], [-0.09819, 53.84686], [0.02386, 53.73917], [0.1141, 53.66535], [0.14257, 53.62343], [0.14547, 53.60735], [0.14392, 53.60183], [0.14349, 53.60796], [0.12457, 53.62339], [0.07959, 53.64099], [0.03449, 53.64919], [-0.05409, 53.62899], [-0.11352, 53.63943], [-0.22725, 53.70847], [-0.24439, 53.73081], [-0.28674, 53.74254], [-0.4192, 53.71956], [-0.44745, 53.71385], [-0.47338, 53.71726]
                  ],
                  area: 0.0,
                  label_position: [0.0159799307584763, 53.9913311426043],
                  poly_type: 'coastal',
                  risk_area_block_id: 6377,
                  counties: [{ name: 'Kingston upon Hull' }, { name: 'N Yorkshire' }, { name: 'E Riding of Yorkshire' }],
                  z_index: 0
                }]
            }
          ]
        }
      ],
      aoc_maps: [
        {
          id: 2677,
          title: 'Specific Areas of Concern Map 1: Monday 29 to Wednesday 31 March 2021.',
          ordering: 0,
          caption: '',
          ratio: [
            { top_left: [55.53955108582219, 0.6497254874557258] },
            { top_right: [55.53955108582219, -4.263228485360742] },
            { bottom_right: [52.71855682694887, -4.263228485360742] },
            { top_left: [55.53955108582219, -4.263228485360742] }],
          statement_id: 1830,
          polys: [
            {
              id: 8354,
              coordinates: [[-0.78842, 54.56071], [-0.74844, 54.53164], [-0.73943, 54.52731], [-0.7148, 54.53348], [-0.68459, 54.52018], [-0.67077, 54.50035], [-0.63395, 54.49637], [-0.58854, 54.48926], [-0.55361, 54.46704], [-0.52146, 54.44695], [-0.5327, 54.43324], [-0.52277, 54.41626], [-0.46368, 54.38917], [-0.44546, 54.36013], [-0.43267, 54.34018], [-0.41704, 54.33145], [-0.40748, 54.29391], [-0.38477, 54.28805], [-0.39653, 54.27424], [-0.36949, 54.24931], [-0.36597, 54.25389], [-0.31912, 54.23388], [-0.27708, 54.21728], [-0.26327, 54.1759], [-0.21253, 54.15757], [-0.15209, 54.14283], [-0.09374, 54.12838], [-0.07638, 54.11641], [-0.16796, 54.09833], [-0.19841, 54.0779], [-0.21192, 54.00732], [-0.18608, 53.95669], [-0.15636, 53.90467], [-0.09819, 53.84686], [0.02386, 53.73917], [0.1141, 53.66535], [0.14257, 53.62343], [0.14547, 53.60735], [0.14392, 53.60183], [0.14349, 53.60796], [0.12457, 53.62339], [0.07959, 53.64099], [0.03449, 53.64919], [-0.05409, 53.62899], [-0.11352, 53.63943], [-0.22725, 53.70847], [-0.24439, 53.73081], [-0.28674, 53.74254], [-0.4192, 53.71956], [-0.44745, 53.71385], [-0.47338, 53.71726]],
              area: 0.0,
              label_position: [0.0159799307584763, 53.9913311426043],
              poly_type: 'coastal',
              risk_area_block_id: 6377,
              counties: [{ name: 'Kingston upon Hull' }, { name: 'N Yorkshire' }, { name: 'E Riding of Yorkshire' }],
              z_index: 0
            }]
        }],
      public_forecast: {
        id: 1830,
        england_forecast: 'Local flooding is possible from rivers in parts of the north of England.',
        welsh_forecast: 'Service unavailable.',
        english_forecast: 'Service unavailable.',
        wales_forecast_english: 'Local coastal flooding is possible but not expected',
        wales_forecast_welsh: 'Mae llifogydd arfordirol lleol yn bosibl ond ni ddisgwylir.',
        published_at: '2021-03-29T10:14:23Z'
      }
    }

    const outlook = new OutlookMap(outlookWithCoastal)

    expect(outlook._geoJson.features[0].geometry.type).to.be.equal('Polygon')
  })
})

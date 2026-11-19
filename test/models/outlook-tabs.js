'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const OutlookTabsModel = require('../../server/models/outlook-tabs')
const data = require('../data')
const moment = require('moment')
const formatDate = require('../../server/util').formatDate

// Helper function to derive expected heading from fixture date and group indices
function getExpectedHeading (issueDate, startIdx, endIdx) {
  const dayNames = Array.from({ length: 5 }, (_, i) => {
    return moment(issueDate).add(i, 'days').format('dddd')
  })
  const labels = dayNames.map((name, index) => {
    if (index === 0) return 'Today'
    if (index === 1) return 'Tomorrow'
    return name
  })
  if (startIdx === endIdx) {
    return labels[startIdx]
  }
  if (endIdx - startIdx === 1) {
    return `${labels[startIdx]} and ${labels[endIdx]}`
  }
  return `${labels[startIdx]} through to ${labels[endIdx]}`
}

describe('Model - Outlook Tabs', () => {
  it('should return the expected groups, merging adjacent days with matching content', async () => {
    const outlook = data.fgs

    const place = { name: 'Manchester, Greater Manchester', center: [-2.2343759536743164, 53.480712890625], bbox2k: [-3.216968300327545, 53.11623436652925, -1.2803249596532866, 53.840428045393054], bbox10k: [-3.322971089502337, 53.05355679509522, -1.1735137703389709, 53.903467893179474], address: 'Manchester, Greater Manchester', isEngland: { is_england: true }, isUK: true, isScotlandOrNorthernIreland: false }

    const viewModel = new OutlookTabsModel(outlook, place)

    expect(viewModel.groups).to.have.length(2)
    expect(viewModel.groups[0].heading).to.equal(getExpectedHeading(outlook.issued_at, 0, 2))
    expect(JSON.stringify(viewModel.groups[0].message)).to.equal('{"3-i3-l4":["overflowing rivers"],"1-i2-l2":["runoff from rainfall or blocked drains"]}')
    expect(viewModel.groups[1].heading).to.equal(getExpectedHeading(outlook.issued_at, 3, 4))
    expect(JSON.stringify(viewModel.groups[1].message)).to.equal('{"2-i2-l4":["overflowing rivers"],"1-i2-l2":["runoff from rainfall or blocked drains"]}')
  })

  it('should return that coastal poly aren\'t failing in turf', async () => {
    const outlook = data.fgsCoastal

    const place = { name: 'Manchester, Greater Manchester', center: [-2.2343759536743164, 53.480712890625], bbox2k: [-3.216968300327545, 53.11623436652925, -1.2803249596532866, 53.840428045393054], bbox10k: [-3.322971089502337, 53.05355679509522, -1.1735137703389709, 53.903467893179474], address: 'Manchester, Greater Manchester', isEngland: { is_england: true }, isUK: true, isScotlandOrNorthernIreland: false }

    const viewModel = new OutlookTabsModel(outlook, place)

    expect(viewModel.groups).to.have.length(3)
    expect(viewModel.groups[0].heading).to.equal(getExpectedHeading(outlook.issued_at, 0, 0))
    expect(JSON.stringify(viewModel.groups[0].message)).to.equal('{"2-i2-l4":"runoff from rainfall or blocked drains and overflowing rivers","1-i2-l2":["high tides or large waves"]}')
    expect(viewModel.groups[1].heading).to.equal(getExpectedHeading(outlook.issued_at, 1, 1))
    expect(JSON.stringify(viewModel.groups[1].message)).to.equal('{"1-i2-l2":"runoff from rainfall or blocked drains, overflowing rivers and high tides or large waves"}')
    expect(viewModel.groups[2].heading).to.equal(getExpectedHeading(outlook.issued_at, 2, 4))
    expect(viewModel.groups[2].isEmpty).to.equal(true)
  })

  it('should format the date correctly and set"outOfDate" as false for FGS created today', async () => {
    const outlook = data.fgs

    outlook.issued_at = moment().utc()

    const formattedIssueDate = formatDate(outlook.issued_at, 'h:mma') + ' on ' + formatDate(outlook.issued_at, 'D MMMM YYYY')

    const place = { name: 'Manchester, Greater Manchester', center: [-2.2343759536743164, 53.480712890625], bbox2k: [-3.216968300327545, 53.11623436652925, -1.2803249596532866, 53.840428045393054], bbox10k: [-3.322971089502337, 53.05355679509522, -1.1735137703389709, 53.903467893179474], address: 'Manchester, Greater Manchester', isEngland: { is_england: true }, isUK: true, isScotlandOrNorthernIreland: false }

    const viewModel = new OutlookTabsModel(outlook, place)

    expect(viewModel.formattedIssueDate).to.equal(formattedIssueDate)
  })

  it('should not intersect any polygons', async () => {
    const outlook = data.fgs
    outlook.issued_at = '2019-11-09T15:30:00Z'

    const place = {
      center: [-1.549103021621704, 53.79969024658203],
      bbox2k: [
        -1.8271425769371719,
        53.68323734173208,
        -1.263577380034181,
        53.96163312595407
      ],
      bbox10k: [
        -1.9339620740885206,
        53.62036759094084,
        -1.1564925522600658,
        54.02466027935582
      ],
      address: 'Leeds, West Yorkshire',
      isEngland: { is_england: true },
      isUK: true,
      isScotlandOrNorthernIreland: false
    }

    const viewModel = new OutlookTabsModel(outlook, place)

    expect(viewModel.groups).to.have.length(2)
    expect(viewModel.groups[0].heading).to.equal(getExpectedHeading(outlook.issued_at, 0, 1))
    expect(viewModel.groups[0].isEmpty).to.equal(true)
    expect(viewModel.groups[1].heading).to.equal(getExpectedHeading(outlook.issued_at, 2, 4))
    expect(JSON.stringify(viewModel.groups[1].message)).to.equal('{"1-i2-l2":"runoff from rainfall or blocked drains and overflowing rivers"}')
    expect(viewModel.lowForFive).to.be.undefined()
  })

  it('should set the trends', async () => {
    const outlook = data.fgsTrends

    const place = {
      name: 'Oxford, Oxfordshire',
      center: [-1.2634600400924683, 51.75374221801758],
      bbox2k: [
        -1.329536933050235,
        51.695334476413464,
        -1.1505065416098395,
        51.81192091799338
      ],
      bbox10k: [
        -1.4306291351125646,
        51.63281784493552,
        -1.0492938978465878,
        51.8745177168812
      ],
      address: 'Oxford, Oxfordshire',
      isEngland: { is_england: true },
      isUK: true,
      isScotlandOrNorthernIreland: false
    }

    const viewModel = new OutlookTabsModel(outlook, place)

    expect(viewModel.trend[0]).to.equal('')
    expect(viewModel.trend[1]).to.equal('rises to')
    expect(viewModel.trend[2]).to.equal('falls to')
    expect(viewModel.trend[3]).to.equal('remains')
  })

  it('should filter and not show FGS with all alerts less than very low', async () => {
    const outlook = data.fgsBelowVeryLow

    const place = {
      name: 'Oxford, Oxfordshire',
      center: [-1.2634600400924683, 51.75374221801758],
      bbox2k: [
        -1.329536933050235,
        51.695334476413464,
        -1.1505065416098395,
        51.81192091799338
      ],
      bbox10k: [
        -1.4306291351125646,
        51.63281784493552,
        -1.0492938978465878,
        51.8745177168812
      ],
      address: 'Oxford, Oxfordshire',
      isEngland: { is_england: true },
      isUK: true,
      isScotlandOrNorthernIreland: false
    }

    const viewModel = new OutlookTabsModel(outlook, place)

    expect(viewModel.groups).to.have.length(1)
    expect(viewModel.groups[0].isEmpty).to.equal(true)
    expect(viewModel.lowForFive).to.equal(true)
  })

  it('should merge all adjacent empty days together, keeping the day with content separate', async () => {
    const outlook = {
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
        [{ surface: 'The surface water flood risk is LOW.\n\nSignificant surface water flooding impacts are possible but not expected across many parts of England and Wales on Friday due to widespread rain and heavy showers. Significant surface water flooding impacts are possible but not expected from thunderstorms on Saturday and Sunday across parts of the north of England.\n\nMinor surface water flooding impacts are possible but not expected from heavy showers on Monday across parts of the north of England and Wales.\n' },
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
        england_forecast: 'Local flooding from surface water and rivers is possible but not expected in places across much of the north of England on Friday due to widespread rain and heavy showers. Local flooding from rivers is possible, and flooding from surface water possible but not expected, across Wales and much of central and southern England on Friday.\nFurther local flooding from surface water and rivers is possible but not expected on Saturday and Sunday in parts of northern England due to heavy, thundery showers.\nLocal minor river and surface water flooding impacts are possible but not expected in parts of the north of England on Monday.\n\nProperties may flood and there may be travel disruption.',
        welsh_forecast: 'Mae llifogydd lleol o ddŵr wyneb ac afonydd yn bosibl ond nid yn ddisgwyliedig mewn mannau ar draws rhan fwyaf o ogledd Lloegr ar ddydd Gwener, o ganlyniad i law eang a chawodydd trwm. Mae llifogydd lleol o afonydd yn bosibl, a llifogydd o ddŵr wyneb yn bosibl ond heb eu disgwyl, ar draws Cymru a llawer o Ganolbarth a De Lloegr ar ddydd Gwener.\n\nMae\'n bosibl bydd llifogydd lleol pellach o ddŵr wyneb ac afonydd, ond heb eu disgwyl, ar ddydd Sadwrn a dydd Sul mewn rhannau o ogledd Lloegr oherwydd cawodydd trwm a stormydd. \n\nBydd siawns o effaith lifogydd o afonydd a dwr wyneb lleol mewn rhannau o Ogledd Lloegr ar Ddydd Llun ond nid yw hyn yn ddisgwyliedig. \n\nGall eiddo orlifo ac mae \'n bosibl y bydd tarfu ar deithio.\n',
        english_forecast: 'Service not available.',
        wales_forecast_english: 'Service not available.',
        wales_forecast_welsh: 'Service not available.',
        published_at: '2019-08-08T11:06:48Z'
      }
    }

    const place = {
      name: 'Leeds, West Yorkshire',
      center: [-1.549103021621704, 53.79969024658203],
      bbox2k: [
        -1.8271425769371719,
        53.68323734173208,
        -1.263577380034181,
        53.96163312595407
      ],
      bbox10k: [
        -1.9339620740885206,
        53.62036759094084,
        -1.1564925522600658,
        54.02466027935582
      ],
      address: 'Leeds, West Yorkshire',
      isEngland: { is_england: true },
      isUK: true,
      isScotlandOrNorthernIreland: false
    }

    const viewModel = new OutlookTabsModel(outlook, place)

    expect(viewModel.groups).to.have.length(2)
    expect(viewModel.groups[0].heading).to.equal(getExpectedHeading(outlook.issued_at, 0, 3))
    expect(viewModel.groups[0].isEmpty).to.equal(true)
    expect(viewModel.groups[1].heading).to.equal(getExpectedHeading(outlook.issued_at, 4, 4))
  })

  it('should issue FGS as yesterday and the first group is populated from "day2"', async () => {
    const outlook = data.fgs

    outlook.issued_at = moment().utc().subtract(1, 'days').format()

    const place = {
      name: 'Derby, Derby City',
      center: [-1.4756419658660889, 52.921897888183594],
      bbox2k: [
        -1.5828973176670098,
        52.845351372881574,
        -1.3570171292814597,
        52.983832884330376
      ],
      bbox10k: [
        -1.6869915641940156,
        52.78266779268941,
        -1.2527871601245748,
        53.04660850960424
      ],
      address: 'Derby, Derby City',
      isEngland: { is_england: true },
      isUK: true,
      isScotlandOrNorthernIreland: false
    }

    const viewModel = new OutlookTabsModel(outlook, place)

    expect(viewModel.groups[0].heading).to.equal('Today')
    expect(JSON.stringify(viewModel.groups[0].message)).to.equal('{"1-i2-l2":["overflowing rivers"]}')
  })

  it('should populate the first group from day 3 when FGS issued is > 24 but <= 48 hours', async () => {
    const outlook = data.fgs

    // outlook.issued_at = moment().utc().subtract(40, 'hours').format()
    outlook.issued_at = moment().subtract(2, 'days').format()

    const place = {
      name: 'Derby, Derby City',
      center: [-1.4756419658660889, 52.921897888183594],
      bbox2k: [
        -1.5828973176670098,
        52.845351372881574,
        -1.3570171292814597,
        52.983832884330376
      ],
      bbox10k: [
        -1.6869915641940156,
        52.78266779268941,
        -1.2527871601245748,
        53.04660850960424
      ],
      address: 'Derby, Derby City',
      isEngland: { is_england: true },
      isUK: true,
      isScotlandOrNorthernIreland: false
    }

    const viewModel = new OutlookTabsModel(outlook, place)

    expect(viewModel.groups).to.have.length(1)
    expect(viewModel.groups[0].isEmpty).to.equal(true)
  })

  it('should set "allDaysSame" to true when all five days have the same likelihood, source and impact', async () => {
    const outlook = {
      id: 1342,
      issued_at: moment().utc().format(),
      pdf_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01342/fgs.pdf',
      detailed_csv_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01342/detailed.csv',
      area_of_concern_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01342/areaofconcern.jpg',
      flood_risk_trend: {
        day1: 'stable',
        day2: 'stable',
        day3: 'stable',
        day4: 'stable',
        day5: 'stable'
      },
      sources: [
        { river: 'The river flood risk is LOW.' },
        { surface: 'The surface water flood risk is VERY LOW for the next five days.' },
        { coastal: 'The coastal/tidal flood risk is VERY LOW for the next five days.' },
        { ground: 'The groundwater flood risk is VERY LOW for the next five days.' }
      ],
      headline: 'Low river flood risk.',
      amendments: '',
      future_forecast: '',
      last_modified_at: moment().utc().format(),
      next_issue_due_at: moment().utc().add(1, 'days').format(),
      png_thumbnails_with_days_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01342/FGSthumbnails-with-days.png',
      risk_areas: [{
        id: 4000,
        statement_id: 1342,
        updated_at: moment().utc().format(),
        beyond_five_days: false,
        ordering: 1,
        risk_area_blocks: [{
          id: 6000,
          days: [1, 2, 3, 4, 5],
          risk_area_id: 4000,
          risk_levels: {
            river: [3, 3]
          },
          additional_information: 'River flooding impacts are possible.',
          polys: [{
            id: 9000,
            coordinates: [[
              [-4.174804687500001, 54.625522440842246],
              [-3.146484643220902, 54.96247882239579],
              [-2.531250268220902, 55.36412729483159],
              [-2.3994143307209015, 55.65031856976615],
              [-1.9599612057209017, 55.90980992336868],
              [0.47141432762146, 53.83838539206968],
              [0.21972656250000003, 53.32848623940286],
              [-4.630237072706223, 53.13119286673744],
              [-4.174804687500001, 54.625522440842246]
            ]],
            area: 8.42310580332646,
            label_position: [-2.08465592935681, 54.1276207351252],
            poly_type: 'inland',
            risk_area_block_id: 6000,
            counties: [{ name: 'Greater Manchester' }]
          }]
        }]
      }],
      aoc_maps: [],
      public_forecast: {
        id: 1342,
        england_forecast: 'Test forecast.',
        welsh_forecast: 'Test forecast.',
        english_forecast: 'Test forecast.',
        wales_forecast_english: 'Test forecast.',
        wales_forecast_welsh: 'Test forecast.',
        published_at: null
      }
    }

    const place = {
      name: 'Manchester, Greater Manchester',
      center: [-2.2343759536743164, 53.480712890625],
      bbox2k: [-3.216968300327545, 53.11623436652925, -1.2803249596532866, 53.840428045393054],
      bbox10k: [-3.322971089502337, 53.05355679509522, -1.1735137703389709, 53.903467893179474],
      address: 'Manchester, Greater Manchester',
      isEngland: { is_england: true },
      isUK: true,
      isScotlandOrNorthernIreland: false
    }

    const viewModel = new OutlookTabsModel(outlook, place)

    expect(viewModel.allDaysSame).to.equal(true)
    expect(viewModel.day5Name).to.be.a.string()
    expect(viewModel.lowForFive).to.be.undefined()
  })

  it('should not set "allDaysSame" when days have different likelihood, source or impact', async () => {
    const outlook = data.fgs

    outlook.issued_at = moment().utc().format()

    const place = {
      name: 'Manchester, Greater Manchester',
      center: [-2.2343759536743164, 53.480712890625],
      bbox2k: [-3.216968300327545, 53.11623436652925, -1.2803249596532866, 53.840428045393054],
      bbox10k: [-3.322971089502337, 53.05355679509522, -1.1735137703389709, 53.903467893179474],
      address: 'Manchester, Greater Manchester',
      isEngland: { is_england: true },
      isUK: true,
      isScotlandOrNorthernIreland: false
    }

    const viewModel = new OutlookTabsModel(outlook, place)

    expect(viewModel.allDaysSame).to.be.undefined()
  })

  it('should capitalise source 3-i4-l2', async () => {
    const outlook = data.fgs3i4l2

    outlook.issued_at = moment().utc()

    const place = {
      name: 'Dover',
      center: [1.3111369609832764, 51.129703521728516],
      bbox2k: [
        1.2292669673802086,
        51.0836829079394,
        1.3721260170100502,
        51.168888198012844
      ],
      bbox10k: [
        1.1145709806332256,
        51.01173729356945,
        1.486822003757033,
        51.24083381229587
      ],
      address: 'Dover, Kent',
      isEngland: { is_england: true },
      isUK: true,
      isScotlandOrNorthernIreland: false
    }

    const viewModel = new OutlookTabsModel(outlook, place)

    expect(viewModel.groups).to.have.length(2)
    expect(viewModel.groups[0].heading).to.equal('Today and Tomorrow')
    expect(JSON.stringify(viewModel.groups[0].message)).to.equal('{"3-i4-l2":"Runoff from rainfall or blocked drains and overflowing rivers"}')
    expect(viewModel.groups[1].isEmpty).to.equal(true)
  })

  function buildOutlookWithBlocks (blocks) {
    return {
      id: 1343,
      issued_at: moment().utc().format(),
      pdf_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01343/fgs.pdf',
      detailed_csv_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01343/detailed.csv',
      area_of_concern_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01343/areaofconcern.jpg',
      flood_risk_trend: {
        day1: 'stable',
        day2: 'stable',
        day3: 'stable',
        day4: 'stable',
        day5: 'stable'
      },
      sources: [
        { river: 'The river flood risk varies over the next five days.' }
      ],
      headline: 'Varying river flood risk.',
      amendments: '',
      future_forecast: '',
      last_modified_at: moment().utc().format(),
      next_issue_due_at: moment().utc().add(1, 'days').format(),
      png_thumbnails_with_days_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01343/FGSthumbnails-with-days.png',
      risk_areas: [{
        id: 4001,
        statement_id: 1343,
        updated_at: moment().utc().format(),
        beyond_five_days: false,
        ordering: 1,
        risk_area_blocks: blocks.map((block, index) => ({
          id: 6001 + index,
          days: block.days,
          risk_area_id: 4001,
          risk_levels: { river: block.riskLevels },
          additional_information: 'River flooding impacts are possible.',
          polys: [{
            id: 9001 + index,
            coordinates: [[
              [-4.174804687500001, 54.625522440842246],
              [-3.146484643220902, 54.96247882239579],
              [-2.531250268220902, 55.36412729483159],
              [-2.3994143307209015, 55.65031856976615],
              [-1.9599612057209017, 55.90980992336868],
              [0.47141432762146, 53.83838539206968],
              [0.21972656250000003, 53.32848623940286],
              [-4.630237072706223, 53.13119286673744],
              [-4.174804687500001, 54.625522440842246]
            ]],
            area: 8.42310580332646,
            label_position: [-2.08465592935681, 54.1276207351252],
            poly_type: 'inland',
            risk_area_block_id: 6001 + index,
            counties: [{ name: 'Greater Manchester' }]
          }]
        }))
      }],
      aoc_maps: [],
      public_forecast: {
        id: 1343,
        england_forecast: 'Test forecast.',
        welsh_forecast: 'Test forecast.',
        english_forecast: 'Test forecast.',
        wales_forecast_english: 'Test forecast.',
        wales_forecast_welsh: 'Test forecast.',
        published_at: null
      }
    }
  }

  const manchesterPlace = {
    name: 'Manchester, Greater Manchester',
    center: [-2.2343759536743164, 53.480712890625],
    bbox2k: [-3.216968300327545, 53.11623436652925, -1.2803249596532866, 53.840428045393054],
    bbox10k: [-3.322971089502337, 53.05355679509522, -1.1735137703389709, 53.903467893179474],
    address: 'Manchester, Greater Manchester',
    isEngland: { is_england: true },
    isUK: true,
    isScotlandOrNorthernIreland: false
  }

  it('should merge days 1 and 2, and separately merge days 3 and 4, keeping day 5 on its own', async () => {
    const outlook = buildOutlookWithBlocks([
      { days: [1, 2], riskLevels: [2, 3] },
      { days: [3, 4], riskLevels: [3, 3] },
      { days: [5], riskLevels: [4, 4] }
    ])

    const day5Name = moment().add(4, 'days').format('dddd')

    const viewModel = new OutlookTabsModel(outlook, manchesterPlace)

    expect(viewModel.groups).to.have.length(3)
    expect(viewModel.groups[0].heading).to.equal('Today and Tomorrow')
    expect(viewModel.groups[1].heading).to.equal(`${moment().add(2, 'days').format('dddd')} and ${moment().add(3, 'days').format('dddd')}`)
    expect(viewModel.groups[2].heading).to.equal(day5Name)
    expect(viewModel.allDaysSame).to.be.undefined()
    expect(viewModel.lowForFive).to.be.undefined()
  })

  it('should merge days 4 and 5, keeping day 3 on its own', async () => {
    const outlook = buildOutlookWithBlocks([
      { days: [1, 2], riskLevels: [2, 3] },
      { days: [3], riskLevels: [4, 4] },
      { days: [4, 5], riskLevels: [3, 3] }
    ])

    const day3Name = moment().add(2, 'days').format('dddd')

    const viewModel = new OutlookTabsModel(outlook, manchesterPlace)

    expect(viewModel.groups).to.have.length(3)
    expect(viewModel.groups[0].heading).to.equal('Today and Tomorrow')
    expect(viewModel.groups[1].heading).to.equal(day3Name)
    expect(viewModel.groups[2].heading).to.equal(`${moment().add(3, 'days').format('dddd')} and ${moment().add(4, 'days').format('dddd')}`)
    expect(viewModel.allDaysSame).to.be.undefined()
    expect(viewModel.lowForFive).to.be.undefined()
  })

  it('should keep days 3, 4 and 5 as separate groups when all three differ', async () => {
    const outlook = buildOutlookWithBlocks([
      { days: [1, 2], riskLevels: [2, 3] },
      { days: [3], riskLevels: [4, 4] },
      { days: [4], riskLevels: [3, 3] },
      { days: [5], riskLevels: [2, 3] }
    ])

    const viewModel = new OutlookTabsModel(outlook, manchesterPlace)

    expect(viewModel.groups).to.have.length(4)
    expect(viewModel.groups[0].heading).to.equal('Today and Tomorrow')
    expect(viewModel.groups[1].heading).to.equal(moment().add(2, 'days').format('dddd'))
    expect(viewModel.groups[2].heading).to.equal(moment().add(3, 'days').format('dddd'))
    expect(viewModel.groups[3].heading).to.equal(moment().add(4, 'days').format('dddd'))
    expect(viewModel.allDaysSame).to.be.undefined()
    expect(viewModel.lowForFive).to.be.undefined()
  })

  it('should merge 3 or more adjacent equal days into a single "through to" heading', async () => {
    const outlook = buildOutlookWithBlocks([
      { days: [1, 2, 3, 4, 5], riskLevels: [3, 3] }
    ])

    const viewModel = new OutlookTabsModel(outlook, manchesterPlace)

    expect(viewModel.groups).to.have.length(1)
    expect(viewModel.groups[0].heading).to.equal(`Today through to ${moment().add(4, 'days').format('dddd')}`)
    expect(viewModel.allDaysSame).to.equal(true)
  })
})

'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const OutlookTabsModel = require('../../server/models/outlookTabs')
const data = require('../data')
const moment = require('moment')
const formatDate = require('../../server/util').formatDate

lab.experiment('outlookTabs model test', () => {
  lab.test('Test OutlookTabsModel', async () => {
    const outlook = data.fgs

    const place = { name: 'Manchester, Greater Manchester', center: [-2.2343759536743164, 53.480712890625], bbox2k: [-3.216968300327545, 53.11623436652925, -1.2803249596532866, 53.840428045393054], bbox10k: [-3.322971089502337, 53.05355679509522, -1.1735137703389709, 53.903467893179474], address: 'Manchester, Greater Manchester', isEngland: { is_england: true }, isUK: true, isScotlandOrNorthernIreland: false }

    const expectedOutlookTab1 = '{"3-i3-l4":["overflowing rivers"],"1-i2-l2":["runoff from rainfall or blocked drains"]}'
    const expectedOutlookTab2 = '{"3-i3-l4":["overflowing rivers"],"1-i2-l2":["runoff from rainfall or blocked drains"]}'
    const expectedOutlookTab3 = '[{"3-i3-l4":["overflowing rivers"],"1-i2-l2":["runoff from rainfall or blocked drains"]},{"2-i2-l4":["overflowing rivers"],"1-i2-l2":["runoff from rainfall or blocked drains"]}]'

    const viewModel = new OutlookTabsModel(outlook, place)

    Code.expect(JSON.stringify(viewModel.tab1)).to.equal(expectedOutlookTab1)
    Code.expect(JSON.stringify(viewModel.tab2)).to.equal(expectedOutlookTab2)
    Code.expect(JSON.stringify(viewModel.tab3)).to.equal(expectedOutlookTab3)
  })
  lab.test('Test OutlookTabsModel with Very Low Coastal', async () => {
    const outlook = data.fgsCoastal

    const place = { name: 'Manchester, Greater Manchester', center: [-2.2343759536743164, 53.480712890625], bbox2k: [-3.216968300327545, 53.11623436652925, -1.2803249596532866, 53.840428045393054], bbox10k: [-3.322971089502337, 53.05355679509522, -1.1735137703389709, 53.903467893179474], address: 'Manchester, Greater Manchester', isEngland: { is_england: true }, isUK: true, isScotlandOrNorthernIreland: false }

    const expectedOutlookTab1 = '{"2-i2-l4":"runoff from rainfall or blocked drains and overflowing rivers","1-i2-l2":["high tides or large waves"]}'
    const expectedOutlookTab2 = '{"1-i2-l2":"runoff from rainfall or blocked drains, overflowing rivers and high tides or large waves"}'
    const expectedOutlookTab3 = '[{}]'

    const viewModel = new OutlookTabsModel(outlook, place)

    Code.expect(JSON.stringify(viewModel.tab1)).to.equal(expectedOutlookTab1)
    Code.expect(JSON.stringify(viewModel.tab2)).to.equal(expectedOutlookTab2)
    Code.expect(JSON.stringify(viewModel.tab3)).to.equal(expectedOutlookTab3)
  })
  lab.test('Test FGS issued is yesterdays, Tab1 is populated from day2', async () => {
    const outlook = data.fgs

    outlook.issued_at = moment().utc().subtract(1, 'days').format()

    const tab1 = '{"3-i3-l4":["overflowing rivers"],"1-i2-l2":["runoff from rainfall or blocked drains"]}'

    const place = { name: 'Manchester, Greater Manchester', center: [-2.2343759536743164, 53.480712890625], bbox2k: [-3.216968300327545, 53.11623436652925, -1.2803249596532866, 53.840428045393054], bbox10k: [-3.322971089502337, 53.05355679509522, -1.1735137703389709, 53.903467893179474], address: 'Manchester, Greater Manchester', isEngland: { is_england: true }, isUK: true, isScotlandOrNorthernIreland: false }

    const viewModel = new OutlookTabsModel(outlook, place)

    Code.expect(JSON.stringify(viewModel.tab1)).to.equal(tab1)
  })
  lab.test('Test OutlookTabs is formating date correctly and outOfDate is false for FGS created today', async () => {
    const outlook = data.fgs

    outlook.issued_at = moment().utc()

    const formattedIssueDate = formatDate(outlook.issued_at, 'h:mma') + ' on ' + formatDate(outlook.issued_at, 'D MMMM YYYY')

    const place = { name: 'Manchester, Greater Manchester', center: [-2.2343759536743164, 53.480712890625], bbox2k: [-3.216968300327545, 53.11623436652925, -1.2803249596532866, 53.840428045393054], bbox10k: [-3.322971089502337, 53.05355679509522, -1.1735137703389709, 53.903467893179474], address: 'Manchester, Greater Manchester', isEngland: { is_england: true }, isUK: true, isScotlandOrNorthernIreland: false }

    const viewModel = new OutlookTabsModel(outlook, place)

    Code.expect(viewModel.formattedIssueDate).to.equal(formattedIssueDate)
    Code.expect(viewModel.outOfDate).to.equal(false)
  })
  lab.test('Test location that doesnt intersect any polygons', async () => {
    const outlook = data.fgs

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

    const expectedOutlookTab1 = '{}'
    const expectedOutlookTab2 = '{}'
    const expectedOutlookTab3 = '[{"1-i2-l2":"runoff from rainfall or blocked drains and overflowing rivers"}]'

    const viewModel = new OutlookTabsModel(outlook, place)

    console.log(JSON.stringify(viewModel.tab1))
    console.log(JSON.stringify(viewModel.tab2))
    console.log(JSON.stringify(viewModel.tab3))

    Code.expect(JSON.stringify(viewModel.tab1)).to.equal(expectedOutlookTab1)
    Code.expect(JSON.stringify(viewModel.tab2)).to.equal(expectedOutlookTab2)
    Code.expect(JSON.stringify(viewModel.tab3)).to.equal(expectedOutlookTab3)
  })
})

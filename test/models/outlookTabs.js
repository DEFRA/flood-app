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

    const expectedOutlookOutputJson = '"tab1":{"3-i3-l4":["river"],"1-i2-l2":["surface"]},"tab2":{"3-i3-l4":["river"],"1-i2-l2":["surface"]}'

    const viewModel = new OutlookTabsModel(outlook, place)

    Code.expect(JSON.stringify(viewModel)).to.contains(expectedOutlookOutputJson)
  })
  lab.test('Test OutlookTabsModel with Very Low Coastal', async () => {
    const outlook = data.fgsCoastal

    const place = { name: 'Manchester, Greater Manchester', center: [-2.2343759536743164, 53.480712890625], bbox2k: [-3.216968300327545, 53.11623436652925, -1.2803249596532866, 53.840428045393054], bbox10k: [-3.322971089502337, 53.05355679509522, -1.1735137703389709, 53.903467893179474], address: 'Manchester, Greater Manchester', isEngland: { is_england: true }, isUK: true, isScotlandOrNorthernIreland: false }

    const expectedOutlookTabs = '"tab1":{"2-i2-l4":["surface","river"],"1-i2-l2":["coastal"]},"tab2":{"1-i2-l2":["surface","river","coastal"]},"dayName":["Monday","Tuesday","Wednesday, Thursday and Friday","Thursday","Friday"],"tab3":[{}]'

    const viewModel = new OutlookTabsModel(outlook, place)

    Code.expect(JSON.stringify(viewModel)).to.contain(expectedOutlookTabs)
  })
  lab.test('Test FGS issued is yesterdays, Tab1 is populated from day2', async () => {
    const outlook = data.fgs

    outlook.issued_at = moment().utc().subtract(1, 'days').format()

    const tab1 = '{"3-i3-l4":["river"],"1-i2-l2":["surface"]}'

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
})

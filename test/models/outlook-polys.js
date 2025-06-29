'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const OutlookPolys = require('../../server/models/outlook-polys')
const outlookOverlaping = require('../data/fgsOverlaping.json')
const outlook = require('../data/fgs.json')

const liverpool = {
  name: 'Liverpool',
  center: [-2.97715402, 53.40906906],
  bbox2k: [-3.14143417419422, 53.29325861688157, -2.7431380933381284, 53.56857304799508],
  bbox10k: [-3.2625314463031407, 53.2213132254306, -2.6220408212292075, 53.640518437630426],
  address: 'Liverpool, Merseyside',
  isEngland: { is_england: true },
  isUK: true,
  isScotlandOrNorthernIreland: false
}

const london = {
  name: 'London',
  center: [-0.12611847, 51.50682449],
  bbox2k: [
    -0.5378394001378515,
    51.26815821078414,
    0.36469941076178336,
    51.70930837101027
  ],
  bbox10k: [
    -0.6538994228880906,
    51.196214024230166,
    0.4807594335120224,
    51.78125254502211
  ],
  address: 'London, Greater London',
  isEngland: { is_england: true },
  isUK: true,
  isScotlandOrNorthernIreland: false
}

const newcastle = {
  name: 'Newcastle Upon Tyne',
  center: [-1.6086086, 54.97790527],
  bbox2k: [
    -1.8055123625086742,
    54.940929335641925,
    -1.4962086143208546,
    55.059360581298264
  ],
  bbox10k: [
    -1.9310749909819551,
    54.868983836081945,
    -1.370645985847574,
    55.13130607998571
  ],
  address: 'Newcastle Upon Tyne, Tyne And Wear',
  isEngland: { is_england: true },
  isUK: true,
  isScotlandOrNorthernIreland: false
}

describe('Model - Outlook Polys', () => {
  it('should have surface, ground, coastal and river with overlapping outlook', () => {
    const result = new OutlookPolys(outlookOverlaping, liverpool)

    const expected = {
      polys: [
        {
          riskLevel: 1,
          impact: 2,
          likelihood: 2,
          day: 4,
          polyId: 7349,
          source: 'surface',
          messageId: '1-i2-l2'
        },
        {
          riskLevel: 1,
          impact: 2,
          likelihood: 2,
          day: 4,
          polyId: 7349,
          source: 'river',
          messageId: '1-i2-l2'
        },
        {
          riskLevel: 1,
          impact: 2,
          likelihood: 2,
          day: 4,
          polyId: 7349,
          source: 'ground',
          messageId: '1-i2-l2'
        },
        {
          riskLevel: 1,
          impact: 2,
          likelihood: 2,
          day: 5,
          polyId: 7350,
          source: 'surface',
          messageId: '1-i2-l2'
        },
        {
          riskLevel: 1,
          impact: 2,
          likelihood: 2,
          day: 5,
          polyId: 7350,
          source: 'river',
          messageId: '1-i2-l2'
        },
        {
          riskLevel: 1,
          impact: 2,
          likelihood: 2,
          day: 5,
          polyId: 7350,
          source: 'ground',
          messageId: '1-i2-l2'
        },
        {
          riskLevel: 1,
          impact: 2,
          likelihood: 2,
          day: 5,
          polyId: 7350,
          source: 'coastal',
          messageId: '1-i2-l2'
        }
      ]
    }

    expect(result).to.equal(expected)
  })

  it('should produce surface and river over two days', () => {
    const result = new OutlookPolys(outlook, london)

    const expected = {
      polys: [
        {
          riskLevel: 2,
          impact: 2,
          likelihood: 3,
          day: 1,
          polyId: 3299,
          source: 'surface',
          messageId: '2-i2-l3'
        },
        {
          riskLevel: 2,
          impact: 2,
          likelihood: 3,
          day: 1,
          polyId: 3299,
          source: 'river',
          messageId: '2-i2-l3'
        },
        {
          riskLevel: 1,
          impact: 2,
          likelihood: 2,
          day: 1,
          polyId: 3300,
          source: 'surface',
          messageId: '1-i2-l2'
        },
        {
          riskLevel: 2,
          impact: 2,
          likelihood: 3,
          day: 2,
          polyId: 3299,
          source: 'surface',
          messageId: '2-i2-l3'
        },
        {
          riskLevel: 2,
          impact: 2,
          likelihood: 3,
          day: 2,
          polyId: 3299,
          source: 'river',
          messageId: '2-i2-l3'
        },
        {
          riskLevel: 1,
          impact: 2,
          likelihood: 2,
          day: 2,
          polyId: 3300,
          source: 'surface',
          messageId: '1-i2-l2'
        }
      ]
    }

    expect(result).to.equal(expected)
  })

  it('should produce an empty array from a given location', () => {
    const result = new OutlookPolys(outlook, newcastle)

    const expected = {
      polys: []
    }

    expect(result).to.equal(expected)
  })
})

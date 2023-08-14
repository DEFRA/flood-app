const moment = require('moment-timezone')
const severity = require('../models/severity')
const { groupBy } = require('../util')
const { svgDataDefault, svgDataOne, svgDataTwo, svgDataThree } = require('../src/images/svgFloodsIcons')

class Floods {
  constructor (data, national = true) {
    this._floods = data
    const grouped = groupBy(data.floods, 'severity_value')
    this._groups = severity.map(item => {
      let floods = grouped[item.id]
      const count = floods ? floods.length : 0
      // For each flood we want to build an HTML header view of it for the /alerts-and-warnings route (this is off the back of performance tuning)
      floods = !floods
        ? floods
        : floods.map(flood => {
          const svgInner = svgMarkup(item)
          createHtml(flood, item, svgInner)
          return flood
        })
      return {
        name: item.id,
        severity: item,
        title: `${count} ${count === 1 ? item.title : item.pluralisedTitle}`,
        description: item.subTitle,
        count,
        floods
      }
    })

    this._geojson = {
      type: 'FeatureCollection',
      totalFeatures: this._floods.floods.length,
      features: []
    }
    this._geojson.features = this._floods.floods.map(item => {
      return {
        type: 'Feature',
        id: 'flood.' + item.ta_code,
        geometry: item.geometry ? JSON.parse(item.geometry) : null,
        properties: {
          ta_code: item.ta_code,
          ta_name: item.ta_name,
          severity_value: item.severity_value,
          severity: item.severity
        }
      }
    })
    // DL: WebGL layers don't support z-index so source data needs to be in desired order
    this._geojson.features.reverse()

    if (this._groups[0].count > 0) {
      this._hasActiveFloods = true
      this._highestSeverityId = this._groups[0].severity.id
    } else if (this._groups[1].count > 0) {
      this._hasActiveFloods = true
      this._highestSeverityId = this._groups[1].severity.id
    } else if (this._groups[2].count > 0) {
      this._hasActiveFloods = true
      this._highestSeverityId = this._groups[2].severity.id
    } else if (this._groups[3].count > 0) {
      this._hasActiveFloods = false
      this._highestSeverityId = this._groups[3].severity.id
    } else {
      this._hasActiveFloods = false
      this._highestSeverityId = 5
    }
  }

  get floods () {
    return this._floods.floods
  }

  get timestamp () {
    return this._floods.timestamp
  }

  get date () {
    return new Date(parseInt(this._floods.timestamp) * 1000)
  }

  get isDummyData () {
    return this.date > new Date('01 Jan 2200')
  }

  get groups () {
    return this._groups
  }

  get geojson () {
    return this._geojson
  }

  get hasActiveFloods () {
    return this._hasActiveFloods
  }

  get highestSeverityId () {
    return this._highestSeverityId
  }
}
module.exports = Floods
function svgMarkup (item) {
  let svgInner
  if (item.id === 3) {
    svgInner = `${svgDataThree}`
  } else if (item.id === 2) {
    svgInner = `${svgDataTwo}`
  } else if (item.id === 1) {
    svgInner = `${svgDataOne}`
  } else {
    svgInner = `${svgDataDefault}`
  }
  return svgInner
}
function createHtml (flood, item, svgInner) {
  flood.html = `
            <li class="defra-flood-warnings-list-item">
              <div class="defra-flood-warnings-list-item__icon">
                <svg role="img" focusable="false" width="38" height="38" viewBox="0 0 38 38" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.41421">
                  <title>${item.title}</title>
                  ${svgInner}
                </svg>
              </div>
              <div class="defra-flood-warnings-list-item__description">
                <a href="/target-area/${flood.ta_code}" class="defra-flood-warnings-list-item__title">${flood.ta_name}</a>
                <span class="defra-flood-warnings-list-item__meta">${item.id === 4 ? 'Removed at' : 'Updated'} 
                <time datetime="${flood.situation_changed}">${moment.tz(flood.situation_changed, 'Europe/London').format('h:mma')} on 
                ${moment(flood.situation_changed).tz('Europe/London').format('D MMMM YYYY')}</time></span>
              </div>
            </li>`
}

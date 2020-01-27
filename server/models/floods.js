const severity = require('../models/severity')
const { groupBy, formatDate } = require('../util')

class Floods {
  constructor (data, national = true) {
    this._floods = data
    const grouped = groupBy(data.floods, 'severity')
    this._groups = severity.map(item => {
      let floods = grouped[item.id]
      const count = floods ? floods.length : 0
      // For each flood we want to build an HTML header view of it for the /alerts-and-warnings route (this is off the back of performance tuning)
      floods = !floods ? floods : floods.map(flood => {
        flood.html = `<li class="defra-flood-list__item defra-flood-list__item--${item.hash}">
                        <span class="defra-flood-list__item-title">
                            <a href="/target-area/${flood.code}">${flood.description}</a>
                        </span>
                        <dl class="defra-flood-list__item-meta">
                            <div>
                          <dt>
                              ${item.severity === 4 ? 'Removed' : 'Updated'}
                          </dt>
                          <dd>
                              <time datetime="${flood.messagechanged}">${formatDate(flood.messagechanged)}</time>
                          </dd>
                            </div>
                        </dl>
                      </li>`
        return flood
      })
      return {
        name: item.id,
        count: count,
        severity: item,
        title: `${count} ${count === 1 ? item.title : item.pluralisedTitle}`,
        floods: floods,
        description: item.subTitle
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
        id: 'flood_warning_alert.' + item.key,
        geometry: item.geometry ? JSON.parse(item.geometry) : null,
        properties: {
          fwa_key: item.key,
          fwa_code: item.code,
          description: item.description,
          severity: item.severity,
          severity_description: item.severitydescription
        }
      }
    })

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

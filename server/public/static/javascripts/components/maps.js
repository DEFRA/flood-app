(function (window, flood) {
  var ol = window.ol

  var maps = {}

  var extent = ol.proj.transformExtent([
    -5.75447130203247,
    49.9302711486816,
    1.79968345165253,
    55.8409309387207
  ], 'EPSG:4326', 'EPSG:3857')

  var center = [
    -1.4758,
    52.9219
  ]

  function onFeatureClick (feature) {
    var id = feature.getId()
    var props = feature.getProperties()
    var html

    if (!props.html) {
      if (id.startsWith('stations')) {
        var stationId = id.substr(9)
        var symbol = 'normal'
        if (props.atrisk) {
          symbol = 'above'
        } else if (props.is_ffoi_at_risk) {
          symbol = 'forecastAbove'
        } else if (props.status === 'Closed' || props.status === 'Suspended') {
          symbol = 'disabled'
        }

        html = `
            <p class="govuk-!-margin-bottom-2">
              <span class="govuk-body-m govuk-!-font-weight-bold">${props.river}</span><br/>
              <a class="govuk-body-s" href="/station/${stationId}">${props.name}</a>
            </p>
            ${props.status === 'Closed' || props.status === 'Suspended' ? `
            <p class="govuk-body-s">Temporarily out of service</p>
            ` : `
            <p class="govuk-body-s">
              <strong class="govuk-font-weight-bold">${props.value}m</strong> latest recorded<br/>
              <strong class="govuk-font-weight-bold">${props.percentile_5}m</strong> flooding possible
              ${props.is_ffoi && props.ffoi_max ? `<br><strong class="govuk-font-weight-bold">${props.ffoi_max}m</strong> forecast high` : ''}
            </p>
            `}
            <span class="ol-overlay__symbol ol-overlay__symbol--${symbol}"></span>
        `
      } else if (id.startsWith('flood_warning_alert_centroid')) {
        html = `
          <p>
            <span class="govuk-body-m govuk-!-font-weight-bold">${props.severity_description}</span><br/>
            <a class="govuk-body-s" href="/target-area/${props.fwa_code}">${props.description}</a>
          </p>
          <span class="ol-overlay__symbol ol-overlay__symbol--${props.severity}"></span>`
      }
      feature.set('html', html)
    }
  }

  maps.extent = extent
  maps.center = center
  maps.onFeatureClick = onFeatureClick

  flood.maps = maps
})(window, window.flood)

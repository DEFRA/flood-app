

    // var activeFeature = {
    //   'items': [
    //     {
    //       'id': 'mapActiveFeature',
    //       'layers': 'layerTargetAreaPolygons,layerTargetAreaPoints',
    //       'states': 'active',
    //       'name': '[Name]',
    //       'formType': 'checkbox',
    //       'checked': 'checked',
    //       'backgroundPosition': '-2px -602px',
    //       'backgroundSize': '120px',
    //       'backgroundPositionOffset': '-83px -602px'
    //     }
    //   ]
    // }

    // var warnings = {
    //   'items': [
    //     {
    //       'id': 'mapWarnings',
    //       'layers': 'layerTargetAreaPolygons,layerTargetAreaPoints',
    //       'states': 'warning,severe',
    //       'name': self.options.activeFeatureId == '' ? 'Flood warnings' : 'All flood warnings',
    //       'formType': 'checkbox',
    //       'checked': self.options.activeFeatureId == '' ? 'checked' : '',
    //       'subgroup': [
    //         {
    //           'id': '',
    //           'name': 'Severe warning',
    //           'formType': '',
    //           'backgroundPosition': '-2px -522px',
    //           'backgroundSize': '120px',
    //           'backgroundPositionOffset': '-83px -522px'
    //         },
    //         {
    //           'id': '',
    //           'name': 'Warning',
    //           'formType': 'checkbox',
    //           'backgroundPosition': '-2px -562px',
    //           'backgroundSize': '120px',
    //           'backgroundPositionOffset': '-83px -562px'
    //         }
    //       ]
    //     }
    //   ]
    // }

    // var alerts = {
    //   'items': [
    //     {
    //       'id': 'mapAlerts',
    //       'layers': 'layerTargetAreaPolygons,layerTargetAreaPoints',
    //       'states': 'alert',
    //       'name': self.options.activeFeatureId == '' ? 'Flood alert' : 'All flood alerts',
    //       'formType': 'checkbox',
    //       'checked': self.options.activeFeatureId == '' ? 'checked' : '',
    //       'backgroundPosition': '-2px -602px',
    //       'backgroundSize': '120px',
    //       'backgroundPositionOffset': '-83px -602px'
    //     }
    //   ]
    // }

    // var removed = {
    //   'items': [
    //     {
    //       'id': 'mapRemoved',
    //       'layers': 'layerTargetAreaPolygons,layerTargetAreaPoints',
    //       'states': 'removed',
    //       'name': self.options.activeFeatureId == '' ? 'Warning no longer inforce' : 'All warnings no longer inforce',
    //       'formType': 'checkbox',
    //       'checked': '',
    //       'backgroundPosition': '-2px -682px',
    //       'backgroundSize': '120px',
    //       'backgroundPositionOffset': '-83px -682px'
    //     }
    //   ]
    // }

    // var levels = {
    //   'items': [
    //     {
    //       'id': 'mapLevels',
    //       'layers': 'layerLevels',
    //       'name': 'River and sea levels',
    //       'formType': 'checkbox',
    //       'checked': '',
    //       'subgroup': [
    //         {
    //           'id': '',
    //           'name': 'Above typical range',
    //           'formType': '',
    //           'backgroundPosition': '2px -121px',
    //           'backgroundSize': '120px'
    //         },
    //         {
    //           'id': '',
    //           'name': 'Above typical range <span class="map-key-features__item-nowrap">(within 36hrs)</span>',
    //           'formType': '',
    //           'backgroundPosition': '2px -81px',
    //           'backgroundSize': '120px'
    //         },
    //         {
    //           'id': '',
    //           'name': 'Within or below typical range',
    //           'formType': '',
    //           'backgroundPosition': '2px -41px',
    //           'backgroundSize': '120px'
    //         }
    //       ]
    //     }
    //   ]
    // }
    // // Set initial visibility
    // if (self.options.showLevels) {
    //   levels.items[0].checked = 'checked'
    // }

    // if (self.options.hasTargetAreas) {
    //   self.configKey.sections.push(warnings)
    //   self.configKey.sections.push(alerts)
    //   // self.configKey.sections.push(concern)
    //   self.configKey.sections.push(removed)
    // }

    // if (self.options.hasLevels) {
    //   self.configKey.sections.push(levels)
    // }
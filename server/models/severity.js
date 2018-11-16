const severity = [{
  id: 1,
  name: 'severe',
  title: 'Severe flood warning',
  pluralisedTitle: 'Severe flood warnings',
  hash: 'severe-flood-warning',
  subTitle: 'Severe flooding',
  tagline: 'Danger to life',
  description: 'danger to life',
  icon: 'icon-flood-warning-severe-large',
  isActive: true
}, {
  id: 2,
  name: 'warning',
  title: 'Flood warning',
  pluralisedTitle: 'Flood warnings',
  hash: 'flood-warning',
  subTitle: 'Flooding is expected',
  tagline: 'Immediate action required',
  icon: 'icon-flood-warning-large',
  isActive: true
}, {
  id: 3,
  name: 'alert',
  title: 'Flood alert',
  pluralisedTitle: 'Flood alerts',
  hash: 'flood-alert',
  subTitle: 'Flooding is possible',
  tagline: 'Be prepared',
  icon: 'icon-flood-alert-large',
  isActive: true
}, {
  id: 4,
  name: 'expired',
  title: 'Flood warning no longer in force',
  pluralisedTitle: 'Flood warnings no longer in force',
  hash: 'expired',
  subTitle: 'Flood warnings and flood alerts removed in the last 24 hours.',
  tagline: 'Flood warnings and flood alerts',
  icon: 'icon-flood-warning-expired-large',
  isActive: false
}]

module.exports = severity

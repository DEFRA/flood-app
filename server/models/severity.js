const severity = [{
  id: 1,
  name: 'severe',
  title: 'Severe flood warning',
  pluralisedTitle: 'Severe flood warnings',
  hash: 'severe-flood-warnings',
  subTitle: 'Severe flooding. Danger to life.',
  tagline: 'Severe flooding',
  description: 'danger to life',
  icon: 'icon-flood-warning-severe-large',
  isActive: true
}, {
  id: 2,
  name: 'warning',
  title: 'Flood warning',
  pluralisedTitle: 'flood warnings',
  hash: 'flood-warnings',
  subTitle: 'Flooding is expected. Immediate action required.',
  tagline: 'Flooding is expected',
  description: 'immediate action required',
  icon: 'icon-flood-warning-large',
  isActive: true
}, {
  id: 3,
  name: 'alert',
  title: 'Flood alert',
  pluralisedTitle: 'Flood alerts',
  hash: 'flood-alerts',
  subTitle: 'Flooding is possible. Be prepared.',
  tagline: 'Flooding is possible',
  description: 'be prepared',
  icon: 'icon-flood-alert-large',
  isActive: true
}, {
  id: 4,
  name: 'expired',
  title: 'Flood warning no longer in force',
  pluralisedTitle: 'Flood warnings no longer in force',
  hash: 'warnings-no-longer-in-force',
  subTitle: 'Flood warnings and flood alerts removed in the last 24 hours.',
  tagline: 'Flood warnings and flood alerts',
  description: 'removed in the last 24 hours',
  icon: 'icon-flood-warning-expired-large',
  isActive: false
}
]

module.exports = severity

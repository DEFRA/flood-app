const severity = [{
  id: 1,
  name: 'severe',
  title: 'Severe flood warning',
  pluralisedTitle: 'Severe flood warnings',
  hash: 'severe-flood-warning',
  subTitle: 'Danger to life',
  tagline: 'Danger to life',
  description: 'danger to life',
  isActive: true
}, {
  id: 2,
  name: 'warning',
  title: 'Flood warning',
  pluralisedTitle: 'Flood warnings',
  hash: 'flood-warning',
  subTitle: 'Flooding is expected',
  tagline: 'Take action',
  isActive: true
}, {
  id: 3,
  name: 'alert',
  title: 'Flood alert',
  pluralisedTitle: 'Flood alerts',
  hash: 'flood-alert',
  subTitle: 'Flooding is possible',
  tagline: 'Be prepared',
  isActive: true
}, {
  id: 4,
  name: 'expired',
  title: 'Warnings removed',
  pluralisedTitle: 'Warnings removed',
  hash: 'expired',
  subTitle: 'Within the last 24hrs',
  tagline: 'Within the last 24hrs',
  isActive: false
}]

module.exports = severity

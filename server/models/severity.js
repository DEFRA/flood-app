const severity = [{
  id: 1,
  name: 'severe',
  title: 'Severe flood warning',
  pluralisedTitle: 'Severe flood warnings',
  hash: 'severe-flood-warning',
  subTitle: 'Severe flooding',
  tagline: 'Danger to life',
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
  subTitle: 'Some flooding is possible',
  tagline: 'Be prepared',
  isActive: true
}, {
  id: 4,
  name: 'expired',
  title: 'Flood warning removed',
  pluralisedTitle: 'Flood warnings removed',
  hash: 'expired',
  subTitle: 'Within the last 24 hours',
  tagline: 'Within the last 24 hours',
  isActive: false
}]

module.exports = severity

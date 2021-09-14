const severity = [{
  id: 3,
  title: 'Severe flood warning',
  pluralisedTitle: 'Severe flood warnings',
  hash: 'severe',
  pluralisedHash: 'severe',
  subTitle: 'Danger to life',
  tagline: 'act now',
  isActive: true,
  actionLink: '/what-to-do-in-a-flood#what-to-do-if-you-get-a-severe-flood-warning'
}, {
  id: 2,
  title: 'Flood warning',
  pluralisedTitle: 'Flood warnings',
  hash: 'warning',
  pluralisedHash: 'warnings',
  subTitle: 'Flooding is expected',
  tagline: 'act now',
  isActive: true,
  actionLink: '/what-to-do-in-a-flood#what-to-do-if-you-get-a-flood-warning'
}, {
  id: 1,
  title: 'Flood alert',
  pluralisedTitle: 'Flood alerts',
  hash: 'alert',
  pluralisedHash: 'alerts',
  subTitle: 'Flooding is possible',
  tagline: 'be prepared',
  isActive: true,
  actionLink: '/what-to-do-in-a-flood#what-to-do-if-you-get-a-flood-alert'
}, {
  id: 4,
  title: 'Flood warning removed',
  pluralisedTitle: 'Flood warnings removed',
  hash: 'removed',
  pluralisedHash: 'removed',
  subTitle: 'in the last 24 hours',
  tagline: '',
  isActive: false,
  actionLink: '/what-to-do-in-a-flood'
}]

module.exports = severity

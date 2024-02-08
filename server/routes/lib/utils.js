function slugify (text = '') {
  return text.replace(/,/g, '').replace(/ /g, '-').toLowerCase()
}

module.exports = {
  slugify
}

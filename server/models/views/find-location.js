
class ViewModel {
  constructor ({ location, err }) {
    Object.assign(this, {
      location,
      err,
      pageTitle: err.errorMessage ? 'Error: Find location - Check for flooding near you' : 'Find location - Check for flooding'
    })
  }
}

module.exports = ViewModel

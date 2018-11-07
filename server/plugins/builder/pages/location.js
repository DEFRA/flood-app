const Page = require('.')

class LocationPage extends Page {
  makeGetRouteHandler (getState) {
    return async (request, h) => {
      const model = this.model
      const state = await model.getState(request)
      const viewModel = {}
      return h.view('location', viewModel)
    }
  }
}

module.exports = LocationPage

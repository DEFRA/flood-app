const joi = require('joi')
const EngineBasePage = require('digital-form-builder-engine/page')

class Page extends EngineBasePage {
  getNext (state) {
    const page = this.model.pages.filter(p => p !== this).find(page => {
      const value = page.section ? state[page.section.name] : state
      const isRequired = page.condition
        ? (this.model.conditions[page.condition]).fn(state)
        : true

      if (isRequired) {
        if (!page.hasFormComponents) {
          return true
        } else {
          const error = joi.validate(value || {}, page.stateSchema.required(), this.model.conditionOptions).error
          const isValid = !error

          return !isValid
        }
      }
    })

    return page && page.path
  }

  get getRouteOptions () {
    return {
      ext: {
        onPostHandler: {
          method: (request, h) => {
            console.log(`GET onPostHandler ${this.path}`)
            return h.continue
          }
        }
      }
    }
  }

  get postRouteOptions () {
    return {
      ext: {
        onPostHandler: {
          method: (request, h) => {
            console.log(`POST onPostHandler ${this.path}`)
            return h.continue
          }
        }
      }
    }
  }
}

module.exports = Page

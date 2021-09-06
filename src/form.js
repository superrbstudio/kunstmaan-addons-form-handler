import { LiveNodeList, LiveElement } from 'live-node-list'
import { bind } from 'decko'
import messagingService from '@superrb/kunstmaan-addons-messaging-service'
import FormField from './field'
import FormEventHandler from './form-event-handler'
import Turbolinks from 'turbolinks'
import RecaptchaHandler from './handlers/recaptcha-handler'
import errorHandler from './service/error-handler'
import { scrollToElement } from './helpers'

/**
 * @type {string}
 */
const GENERIC_ERROR = 'Sorry, something went wrong. Please try what you were doing again.'

export default class Form {
  /**
   * @type {FormEventHandler[]}
   */
  static customHandlers = [
    RecaptchaHandler
  ]

  /**
   * @type {Field[]}
   */
  fields = {}

  /**
   * @type {FormEventHandler[]}
   */
  handlers = {}

  /**
   * @return {FormData}
   */
  get data () {
    return new FormData(this.element)
  }

  /**
   * @param {HTMLFormElement} element
   */
  constructor (element) {
    /**
     * @type {HTMLFormElement} element
     */
    this.element = element

    /**
     * @type {string}
     */
    this.name = this.element.name

    /**
     * @type {LiveNodeList}
     */
    this.fieldNodeList = new LiveNodeList('.form-group', this.element)
    this.fieldNodeList.forEach(this.addField)

    /**
     * @type {LiveNodeList}
     */
    this.buttons = new LiveNodeList('.button[type="submit"], input[type="submit"]', this.element)

    /**
     * @type {LiveElement}
     */
    this.errorMessage = new LiveElement('.message--error', this.element)

    this.constructor.customHandlers.forEach(handler => {
      if (handler.formName in this.fields) {
        this.handlers[handler.handlerName] = new handler(this, this.fields[handler.formName])
      }

      if (handler.formName === this.name) {
        this.handlers[handler.handlerName] = new handler(this)
      }

      if ('formNameRegex' in handler) {
        Object.keys(this.fields).forEach(name => {
          if (name.match(handler.formNameRegex)) {
            this.handlers[handler.handlerName] = new handler(this, this.fields[name])
          }
        })

        if (this.name.match(handler.formNameRegex)) {
          this.handlers[handler.handlerName] = new handler(this)
        }
      }
    })

    this.registerListeners()
  }

  /**
   *
   */
  registerListeners () {
    this.fieldNodeList.on('update', (newItems, oldItems) => {
      oldItems.forEach(this.removeField)
      newItems.forEach(this.addField)
    })

    this.buttons.on('update', (newItems, oldItems) => {
      this.enableButtons()
    })

    if ('jsSubmit' in this.element.dataset && this.element.dataset.jsSubmit === 'true') {
      this.element.addEventListener('submit', this.handleSubmit)
    }
  }

  /**
   * @param {Event} event
   */
  @bind
  async handleSubmit (event) {
    if (event) {
      event.preventDefault()
    }

    this.disableButtons()

    this.clearErrors()

    const valid = await Promise.all(Object.keys(this.handlers).map(name => this.handlers[name].process(event)))
      .catch(this.setErrors)

    if (!valid) {
      this.enableButtons()

      return
    }

    const response = await fetch(this.element.action, {
      method: this.element.method || 'POST',
      mode: 'cors',
      credentials: 'include',
      body: this.data
    })

    try {
      const data = await response.json()

      if (data.action_required) {
        let handled = await Promise.all(Object.keys(this.handlers).map(name => this.handlers[name].handleAction(data.action_required)))
        handled = handled.reduce((previous, current) => {
          if (current === false) {
            return false
          }

          return previous
        }, true)

        // If action was handled, resubmit the form
        if (handled !== true) {
          this.enableButtons()

          return
        }
      }

      if (data.message) {
        messagingService.success(data.message, 5000)
        await setTimeout(() => { /* noop */ }, 2000)
      }

      if (data.redirect_url) {
        try {
          Turbolinks.visit(data.redirect_url)
        } catch (error) {
          // Handle cases where Turbolinks redirect fails and resort
          // to a standard browser redirect
          window.location = data.redirect_url
        }

        return
      }

      if ('events' in data) {
        data.events.forEach(event => {
          if (typeof event === 'string') {
            return document.dispatchEvent(new CustomEvent(event))
          }

          document.dispatchEvent(new CustomEvent(event.name, { detail: event.data }))
        })
      }

      this.setErrors(data.errors)
      this.enableButtons()
    } catch (error) {
      console.error(error)
      messagingService.error(GENERIC_ERROR, 5000)
    }

    this.enableButtons()
  }

  /**
   * @param {HTMLElement} field
   *
   * @return {string|null}
   */
  @bind
  getFieldName (field) {
    let name = field.name
    if (field.dataset.name) {
      name = field.dataset.name.replace(`${this.element.name}_`, '')
    }

    return name
  }

  /**
   * @param {HTMLElement} field
   */
  @bind
  addField (field) {
    const name = this.getFieldName(field)

    if (name) {
      this.fields[name] = new FormField(this, field)
    }
  }

  /**
   * @param {HTMLElement} field
   */
  @bind
  removeField (field) {
    const name = this.getFieldName(field)

    if (name) {
      delete this.fields[name]
    }
  }

  /**
   * @param {object} errors
   */
  @bind
  setErrors (errors) {
    if (!errors || typeof errors !== 'object') {
      return
    }

    Object.keys(errors).forEach(field => {
      if (field === this.element.name) {
        this.setError(errors[field])

        return
      }

      if (field === '.') {
        messagingService.error(errors[field], 5000)

        return
      }

      const name = field.replace(`${this.element.name}_`, '')

      if (name && (name in this.fields)) {
        this.fields[name].setError(errors[field])
      }
    })

    const firstError = this.element.querySelector('.form-group--has-error')
    if (firstError) {
      scrollToElement(firstError, 500)
    }
  }

  /**
   *
   */
  clearErrors () {
    this.removeError()
    messagingService.closeAll()
    Object.keys(this.fields).forEach(name => this.fields[name].removeError())
  }

  /**
   * @param {string} message
   */
  setError (message) {
    errorHandler.setError(this, message)
  }

  /**
   *
   */
  removeError () {
    errorHandler.removeError(this)
  }

  /**
   *
   */
  disableButtons () {
    this.buttons.forEach(button => {
      button.classList.add('button--loading')
    })
  }

  /**
   *
   */
  enableButtons () {
    this.buttons.forEach(button => {
      button.classList.remove('button--loading')
    })
  }
}

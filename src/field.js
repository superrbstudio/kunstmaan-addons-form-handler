import { LiveNodeList, LiveElement } from 'live-node-list'
import { bind } from 'decko'
import Form from './form'
import errorHandler from './service/error-handler'

export default class FormField {
  /**
   * @type {Function[]}
   */
  onChangeHandlers = []

  /**
   * @type {HTMLInputElement}
   */
  get input () {
    if (this.inputs.items.length === 0) {
      return null
    }

    return this.inputs.items[0]
  }

  /**
   * @param {Form} form
   * @param {HTMLElement} element
   */
  constructor (form, element) {
    /**
     * @type {Form}
     */
    this.form = form

    /**
     * @type {HTMLElement}
     */
    this.element = element

    /**
     * @type {LiveNodeList}
     */
    this.inputs = new LiveNodeList('input, textarea, select', this.element)

    /**
     * @type {LiveElement}
     */
    this.errorMessage = new LiveElement('.message--error', this.element)

    this.registerListeners()
    this.setupDependencies()
  }

  /**
   *
   */
  registerListeners () {
    /**
     * @param {Event} event
     */
    const callback = event => {
      this.removeError()

      this.onChangeHandlers.forEach(handler => {
        handler(this, event)
      })
    }

    this.inputs.addEventListener('change', callback)
    this.inputs.addEventListener('blur', callback)
    this.element.addEventListener('change', callback)
    this.element.addEventListener('blur', callback)
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
   * @param {Function} callback
   */
  onChange (callback) {
    this.onChangeHandlers.push(callback)
    callback(this)
  }

  /**
   *
   */
  setupDependencies () {
    if (!('dependsOn' in this.element.dataset)) {
      return
    }

    this.dependencies = JSON.parse(this.element.dataset.dependsOn)

    for (const name in this.dependencies) {
      const value = this.dependencies[name]
      const dependency = this.form.fields[name]

      if (!dependency) {
        return
      }

      dependency.onChange(this.checkValues)
    }
  }

  /**
   *
   */
  @bind
  checkValues () {
    for (const name in this.dependencies) {
      const value = this.dependencies[name]
      const dependency = this.form.fields[name]
      const valid = this.checkValue(value, dependency)

      if (!valid) {
        this.hide()
        return
      }
    }

    this.show()
  }

  /**
   * @param {any} value
   * @param {FormField} field
   * @param {Event} event
   *
   * @return {boolean}
   */
  @bind
  checkValue (value, field, event = null) {
    const input = field.input
    if (!input) {
      return false
    }

    if (['checkbox', 'radio'].includes(input.type)) {
      if (typeof value === 'boolean') {
        if ((value === true && input.checked) || (value === false && !input.checked)) {
          return true
        }

        return false
      }

      if (field.inputs.items.length > 0) {
        const checked = !!Array.prototype.filter.call(field.inputs.items, input => {
          return input.checked && input.value === value
        }).shift()

        if (checked) {
          return true
        }

        return false
      }
    }

    if (input.value === value) {
      return true
    }

    return false
  }

  /**
   *
   */
  @bind
  show () {
    this.element.setAttribute('aria-hidden', 'false')
  }

  /**
   *
   */
  @bind
  hide () {
    this.element.setAttribute('aria-hidden', 'true')

    if (['checkbox', 'radio'].includes(this.input.type)) {
      this.inputs.forEach(input => {
        input.checked = false
      })
    } else {
      this.input.value = this.input.dataset.defaultValue || null
    }
  }
}

import { LiveNodeList, LiveElement } from 'live-node-list'
import { bind } from 'decko'
import Form from './form'

export default class FormField {
  /**
   * @type {Function[]}
   */
  onChangeHandlers = []

  /**
   * @type {HTMLInputElement}
   */
  get input() {
    if (this.inputs.items.length === 0) {
      return null
    }

    return this.inputs.items[0]
  }

  /**
   * @param {Form} form
   * @param {HTMLElement} element
   */
  constructor(form, element) {
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
  registerListeners() {
    /**
     * @param {Event} event
     */
    const callback = event => {
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
  setError(message) {
    this.element.classList.add('form-group--has-error')

    if (this.errorMessage.item) {
      this.errorMessage.item.innerHTML = message
      return
    }

    const errorMessage = document.createElement('span')
    errorMessage.classList.add('message')
    errorMessage.classList.add('message--error')
    errorMessage.innerHTML = message
    this.element.append(errorMessage)
  }

  /**
   *
   */
  removeError() {
    this.element.classList.remove('form-group--has-error')

    if (this.errorMessage.item && this.errorMessage.item.parentNode) {
      this.errorMessage.item.parentNode.removeChild(this.errorMessage.item)
    }
  }

  /**
   * @param {Function} callback
   */
  onChange(callback) {
    this.onChangeHandlers.push(callback)
    callback(this)
  }

  /**
   *
   */
  setupDependencies() {
    if (!('dependsOn' in this.element.dataset)) {
      return
    }

    const dependencies = JSON.parse(this.element.dataset.dependsOn)

    Object.keys(dependencies).forEach(name => {
      const value = dependencies[name]
      const dependency = this.form.fields[name]

      if (!dependency) {
        return
      }

      dependency.onChange(this.checkValue.bind(this, value))
    })
  }

  /**
   * @param {any} value
   * @param {FormField} field
   * @param {Event} event
   *
   * @return {boolean}
   */
  @bind
  checkValue(value, field, event = null) {
    const input = field.input
    if (!input) {
      return false
    }

    if (['checkbox', 'radio'].includes(input.type)) {
      if (typeof value === 'boolean') {
        if ((value === true && input.checked) || (value === false && !input.checked)) {
          this.show()
          return true
        }

        this.hide()
        return false
      }

      if (field.inputs.items.length > 0) {
        const checked = !!Array.prototype.filter.call(field.inputs.items, input => {
          return input.checked && input.value === value
        }).shift()

        if (checked) {
          this.show()
          return true
        }

        this.hide()
        return false
      }
    }

    if (input.value === value) {
      this.show()
      return true
    }

    this.hide()
    return false
  }

  /**
   *
   */
  @bind
  show() {
    this.element.setAttribute('aria-hidden', 'false')
  }

  /**
   *
   */
  @bind
  hide() {
    this.element.setAttribute('aria-hidden', 'true')

    if (['checkbox', 'radio'].includes(this.input.type)) {
      this.inputs.forEach(input => {
        input.checked = false
      })
    } else {
      this.input.value = null
    }
  }
}

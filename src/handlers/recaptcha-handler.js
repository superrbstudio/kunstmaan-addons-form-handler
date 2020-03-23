import { LiveElement } from 'live-node-list'
import { bind } from 'decko'
import { load as loadRecaptcha } from 'recaptcha-v3'
import FormEventHandler from '../form-event-handler'
import Form from '../form'
import FormField from '../field'
import { isVisible } from '../helpers'

export default class RecaptchaHandler extends FormEventHandler {
  /**
   * @type {string}
   *
   * @static
   */
  static handlerName = 'RecaptchaHandler'

  /**
   * @type {string}
   *
   * @static
   */
  static formName = 'recaptcha'

  /**
   * @type {boolean}
   *
   * @static
   */
  static loadStarted = false

  /**
   * @type {LiveElement}
   *
   * @static
   */
  static recaptchaMessage = new LiveElement('#recaptcha-message')

  /**
   * @type {Element[]}
   *
   * @static
   */
  static visibleForms = []

  /**
   * @param {Form} form
   * @param {FormField} field
   */
  constructor(form, field) {
    super(form, field)

    this.setupRecaptcha()

    if (this.constructor.formName in this.form.fields && this.field && this.field.input) {
      this.field.input.value = null
      this.registerListeners()
    }
  }

  /**
   *
   */
  registerListeners() {
    document.addEventListener('validation:fail', e => {
      if (this.constructor.formName in this.form.fields && this.field && this.field.input) {
        this.field.input.value = null
      }
    })

    this.formObserver = new IntersectionObserver(this.checkFormVisibility, {
      trackVisibility: true,
      delay: 500
    })
    this.formObserver.observe(this.form.element)
  }

  @bind
  async setupRecaptcha() {
    // Load recaptcha library
    if (!this.constructor.loadStarted && !window.recaptcha) {
      this.constructor.loadStarted = true

      window.recaptcha = await loadRecaptcha('explicit', { autoHideBadge: true })

      this.recaptchaHandle = grecaptcha.render('recaptcha-container', {
        sitekey: RECAPTCHA_KEY,
        badge: 'inline', // must be inline
        size: 'invisible' // must be invisible
      })
    }
  }

  /**
   * @param {IntersectionObserverEntry[]} entries
   */
  @bind
  async checkFormVisibility(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && isVisible(entry.target)) {
        if (!this.constructor.visibleForms.includes(this.form)) {
          this.constructor.visibleForms.push(this.form)
        }
      } else {
        if (this.constructor.visibleForms.includes(this.form)) {
          this.constructor.visibleForms.splice(this.constructor.visibleForms.indexOf(this.form), 1)
        }
      }

      if (this.constructor.visibleForms.length === 0) {
        this.constructor.recaptchaMessage.item.setAttribute('aria-hidden', 'true')
      } else {
        this.constructor.recaptchaMessage.item.setAttribute('aria-hidden', 'false')
      }
    })
  }

  /**
   * @param {Event} event
   *
   * @return {Promise<Boolean>}
   */
  @bind
  async process(event) {
    if (this.field && this.field.input && !this.field.input.value) {
      return this.getToken(event)
    }

    return true
  }

  /**
   * @param {Event} event
   *
   * @return {Promise<Boolean>}
   */
  @bind
  async getToken(event) {
    const recaptchaInput = this.field.input
    if (recaptchaInput) {
      // Get a recaptcha token
      try {
        const token = await window.grecaptcha.execute(this.recaptchaHandle)

        // Append the recaptcha token to the form
        recaptchaInput.value = token
      } catch (error) {
        console.error(error)
      }

      // Reset the recaptcha field value on a timeout, to ensure double submissions
      // don't cause errors
      setTimeout(t => {
        this.field.input.value = null
      }, 2000)

      return true
    }
  }
}

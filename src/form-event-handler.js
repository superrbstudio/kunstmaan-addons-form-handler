import Form from './form'
import Field from './field'

export default class FormEventHandler {
  /**
   * @param {Form} form
   * @param {Field} field
   */
  constructor (form, field) {
    /**
     * @type {Form}
     */
    this.form = form

    /**
     * @type {Field}
     */
    this.field = field
  }

  /**
   * @param {Event} event
   *
   * @return {Promise<boolean>}
   */
  async process (event) {
    // no op
    return Promise.resolve(true)
  }

  /**
   * @param {object} action
   *
   * @return {Promise<boolean>}
   */
  async handleAction (action) {
    // no op
    return Promise.resolve(true)
  }
}

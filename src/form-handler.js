import { LiveNodeList } from 'live-node-list'
import Form from './form'

export default class FormHandler {
  /**
   * @type {LiveNodeList}
   */
  formElements = new LiveNodeList('form')

  /**
   * @type {Form[]}
   */

  forms = {}

  /**
   *
   */
  constructor() {
    this.formElements.forEach(form => {
      this.forms[form.name] = new Form(form)
    })

    this.registerListeners()
  }

  /**
   *
   */
  registerListeners() {
    this.formElements.on('update', (newItems, oldItems) => {
      oldItems.forEach(form => {
        delete this.forms[form.name]
      })
      newItems.forEach(form => {
        this.forms[form.name] = new Form(form)
      })
    })
  }
}

import Form from '../form'
import Field from '../field'

class ErrorHandler {
  /**
   * @param {Form|Field} field
   * @param {string}     message
   */
  setError(field, message) {
    if (field instanceof Field) {
      field.element.classList.add('form-group--has-error')
    } else if (field instanceof Form) {
      field.element.classList.add('form--has-error')
    }

    if (field.errorMessage.item) {
      field.errorMessage.item.innerHTML = message
      return
    }

    const errorMessage = document.createElement('span')
    errorMessage.classList.add('message')
    errorMessage.classList.add('message--error')
    errorMessage.innerHTML = message
    field.element.append(errorMessage)
  }

  removeError(field) {
    if (field instanceof Field) {
      field.element.classList.remove('form-group--has-error')
    } else if (field instanceof Form) {
      field.element.classList.remove('form--has-error')
    }

    if (field.errorMessage.item && field.errorMessage.item.parentNode) {
      field.errorMessage.item.parentNode.removeChild(field.errorMessage.item)
    }
  }
}

export const errorHandler = new ErrorHandler()
export default errorHandler

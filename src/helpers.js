// -- Cross browser method to get style properties:
function _getStyle (element, property) {
  if (window.getComputedStyle) {
    return document.defaultView.getComputedStyle(element, null)[property]
  }
  if (element.currentStyle) {
    return element.currentStyle[property]
  }
}

function _elementInDocument (element) {
  while (element = element.parentNode) {
    if (element == document) {
      return true
    }
  }
  return false
}

/**
 * Author: Jason Farrell
 * Author URI: http://useallfive.com/
 *
 * Description: Checks if a DOM element is truly visible.
 * Package URL: https://github.com/UseAllFive/true-visibility
 *
 * Checks if a DOM element is visible. Takes into
 * consideration its parents and overflow.
 *
 * @param {Element} element      the DOM element to check if is visible
 *
 * These params are optional that are sent in recursively,
 * you typically won't use these:
 *
 * @param {number} t       Top corner position number
 * @param {number} r       Right corner position number
 * @param {number} b       Bottom corner position number
 * @param {number} l       Left corner position number
 * @param {number} w       Element width number
 * @param {number} h       Element height number
 *
 * @return {boolean}
 */
export const isVisible = (element, t, r, b, l, w, h) => {
  var p = element.parentNode
  var VISIBLE_PADDING = 2

  if (!_elementInDocument(element)) {
    return false
  }

  // -- Return true for document node
  if (p.nodeType === 9) {
    return true
  }

  // -- Return false if our element is invisible
  if (
    _getStyle(element, 'opacity') === '0' ||
    _getStyle(element, 'display') === 'none' ||
    _getStyle(element, 'visibility') === 'hidden'
  ) {
    return false
  }

  if (
    typeof (t) === 'undefined' ||
    typeof (r) === 'undefined' ||
    typeof (b) === 'undefined' ||
    typeof (l) === 'undefined' ||
    typeof (w) === 'undefined' ||
    typeof (h) === 'undefined'
  ) {
    t = element.offsetTop
    l = element.offsetLeft
    b = t + element.offsetHeight
    r = l + element.offsetWidth
    w = element.offsetWidth
    h = element.offsetHeight
  }

  // -- If we have a parent, let's continue:
  if (p) {
    // -- Check if the parent can hide its children.
    if ((_getStyle(p, 'overflow') === 'hidden' || _getStyle(p, 'overflow') === 'scroll')) {
      // -- Only check if the offset is different for the parent
      if (
        // -- If the target element is to the right of the parent elm
        l + VISIBLE_PADDING > p.offsetWidth + p.scrollLeft ||
        // -- If the target element is to the left of the parent elm
        l + w - VISIBLE_PADDING < p.scrollLeft ||
        // -- If the target element is under the parent elm
        t + VISIBLE_PADDING > p.offsetHeight + p.scrollTop ||
        // -- If the target element is above the parent elm
        t + h - VISIBLE_PADDING < p.scrollTop
      ) {
        // -- Our target element is out of bounds:
        return false
      }
    }

    // -- Add the offset parent's left/top coords to our element's offset:
    if (element.offsetParent === p) {
      l += p.offsetLeft
      t += p.offsetTop
    }

    // -- Let's recursively check upwards:
    return isVisible(p, t, r, b, l, w, h)
  }

  return true
}

/**
 * Animate a value
 *
 * @param {number}   from
 * @param {number}   to
 * @param {number}   duration
 * @param {function} callback
 *
 * @return {void}
 */
export function animate (from, to, duration = 500, callback, easing = ease) {
  const diff = to - from

  if (!diff) {
    return
  }

  let start, value

  /**
   * Set values for each step in the animation
   *
   *
   * @param {number} timestamp
   */
  const step = function (timestamp) {
    if (!start) {
      start = timestamp
    }

    var time = timestamp - start
    var percent = easing(Math.min(time / duration, 1))

    value = (from + diff * percent)

    if (time >= duration) {
      value = to
      callback(value)
      return
    }

    callback(value)
    requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

/**
 * Smoothly scroll to an element on the page
 *
 * @param {HTMLElement} element
 * @param {Number} duration
 *
 * @return {void}
 */
export function scrollToElement (element, duration = 500, offset = 0) {
  const from = window.pageYOffset
  const to = element.getBoundingClientRect().top + window.pageYOffset + offset

  return animate(from, to, duration, y => {
    window.scrollTo(0, y)
  })
}

/**
 * Smoothly scroll to an element on the page
 *
 * @param {Number} position
 * @param {Number} duration
 *
 * @return {void}
 */
export function scrollToPosition (position = 0, duration = 500) {
  const from = window.pageYOffset
  const to = position

  return animate(from, to, duration, y => {
    window.scrollTo(0, y)
  })
}

/**
 * Easing function, equivalent to easeInOutCubic
 *
 * @see {https://gist.github.com/gre/1650294}
 *
 * @param {number} t
 *
 * @return {number}
 */
export function ease (t) {
  if (t < 0.5) {
    return 4 * t * t * t
  }

  return (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
}

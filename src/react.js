import {Component, createElement, createContext} from 'react'
import * as ir from './imperouter'
import * as u from './utils'

const HistoryContext = createContext()

// Passes history to links.
export function Context() {
  if (!(this instanceof Context)) throw Error('Context must be invoked with `new`')
  Component.apply(this, arguments)
}

const CP = Context.prototype = Object.create(Component.prototype)

CP.render = function render() {
  const {history, children} = this.props
  return createElement(HistoryContext.Provider, {value: history, children})
}

/*
Pushstate link.

Accepts strings or "locations" with the same structure as `window.location` or
the location used by the `history` library (see below). The structure is
`{pathname, search, query, hash, state}`, where all parts are optional. The
`query` support is specific to Imperouter. If present, the query is
automatically encoded as `search`.

Supports detection of the "current path", enabled by passing a `location` prop.
When "current", a link has the `[aria-current='true']` attribute.

Requires `this.context.history`, which must be API-compatible with
https://github.com/ReactTraining/history. You MUST set it up, otherwise links
won't activate. Example:

  import createBrowserHistory from 'history/es/createBrowserHistory'
  import {Context} from 'imperouter/react'

  const history = createBrowserHistory()

  <Context history={history}> ... site content ... </Context>

*/
export function Link() {
  if (!(this instanceof Link)) throw Error('Link must be invoked with `new`')
  Component.apply(this, arguments)
  this.onClick = this.onClick.bind(this)
}

Link.contextType = HistoryContext

const LP = Link.prototype = Object.create(Component.prototype)

LP.constructor = Link

LP.onClick = function onClick(event) {
  const {context: history, props, props: {target, onClick}} = this

  if (history && isLeftClickEvent(event) && !isModifiedEvent(event) && target !== '_blank') {
    navigateOnClick(event, props, history)
  }

  if (u.isFunction(onClick)) onClick(event)
}

LP.render = function render() {
  const props = u.copy(this.props)

  const {to, location, exact} = props
  props.to       = undefined
  props.replace  = undefined
  props.location = undefined
  props.exact    = undefined

  // Detect and mark "current path"
  if (location != null) {
    u.validate(location, u.isObject)
    const current   = location.pathname
    const pathname  = getLinkPathname(to)
    const isCurrent = exact ? pathname === current : isSubpath(pathname, current)
    props['aria-current'] = isCurrent || undefined
  }

  props.href    = u.isObject(to) ? ir.encodeLocation(to) : to
  props.onClick = this.onClick

  return createElement('a', props)
}

/** Utils **/

function navigateOnClick(event, props, history) {
  const {to, replace} = props
  if (to == null) return

  event.preventDefault()

  const href = u.isObject(to) ? ir.encodeLocation(to) : to
  const state = u.isObject(to) ? to.state : undefined

  if (replace) history.replace(href, state)
  else history.push(href, state)
}

function isLeftClickEvent(event) {
  return event.type === 'click' && event.button === 0
}

function isModifiedEvent(event) {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
}

function isSubpath(short, long) {
  return u.isString(short) &&
    u.isString(long) &&
    long.indexOf(short) === 0 &&
    (long.length === short.length || long[short.length] === '/')
}

function getLinkPathname(link) {
  return u.isObject(link)
    ? link.pathname
    : u.isString(link)
    ? ir.URL_REGEXP.exec(link)[3]
    : undefined
}

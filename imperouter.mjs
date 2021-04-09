import * as querystring from 'querystring'
import * as u from './utils.mjs'

export function findRouteMatch(routes, pathname) {
  u.validate(routes, u.isArray)
  pathname = u.onlyString(pathname)
  for (let i = 0; i < routes.length; i += 1) {
    const match = matchRoute(routes[i], pathname)
    if (match) return match
  }
  return undefined
}

export function matchRoute(route, pathname) {
  u.validate(route, u.isObject)
  pathname = u.onlyString(pathname)

  const {path: regexp, params: paramKeys} = route
  u.validate(regexp, u.isRegExp)

  // Note: regexps with a "global" flag preserve state between calls to `.exec`
  // or `.test`. They also produce surprising output with
  // `String.prototype.match`. There are ways to reset the state, but it seems
  // cleaner to avoid the hazard in the first place.
  if (regexp.global) {
    throw Error(`Path regexps must not have a global flag; got ${regexp}`)
  }

  const match = regexp.exec(pathname)
  if (!match) return undefined

  // If exists, `match.groups` should be a null-prototype object with the
  // captured values.
  const params = match.groups || Object.create(null)
  if (paramKeys != null) {
    u.validate(paramKeys, u.isArray)
    for (let i = 0; i < paramKeys.length; i += 1) {
      const key = paramKeys[i]
      u.validate(key, u.isString)
      params[key] = match[i + 1]
    }
  }

  match.route = route
  match.params = params
  return match
}

export function decodeLocation(url) {
  url = u.onlyString(url)
  // Note: all parts of the regex are optional, it can never fail
  const [__, protocol, host, pathname, search, hash] = URL_REGEXP.exec(url)
  return {
    protocol: protocol || '',
    host: host || '',
    pathname: pathname || '',
    search: search || '',
    query: decodeQuery(search || ''),
    hash: hash || '',
  }
}

export const URL_REGEXP = /^(?:(\w+:)[/][/])?([^,;!?/#\s]*)?([^,;!?#\s]*)?(\?[^,;!#\s]*)?(#[^,;!\s]*)?/

export function encodeLocation(location) {
  u.validate(location, u.isObject)

  let {protocol, host, pathname, search, query, hash} = location
  protocol = u.onlyString(protocol)
  host = u.onlyString(host)
  pathname = u.onlyString(pathname)
  search = u.prependIfMissing('?', query ? encodeQuery(query) : u.onlyString(search))
  hash = u.prependIfMissing('#', u.onlyString(hash))

  return (
    (protocol ? protocol + '//' : '') + host + pathname + search + hash
  )
}

export function decodeQuery(searchString) {
  searchString = u.onlyString(searchString)
  return querystring.decode(searchString.replace(/^[?]/, ''))
}

export function encodeQuery(query) {
  return querystring.encode(u.omitNil(query))
}

// Updates `location.query` to match `location.search`.
export function withQuery(location) {
  u.validate(location, u.isObject)
  location = u.copy(location)
  location.query = decodeQuery(location.search)
  return location
}

// Updates `location.search` to match `location.query`.
export function withSearch(location) {
  u.validate(location, u.isObject)
  location = u.copy(location)
  location.search = u.prependIfMissing('?', encodeQuery(location.query))
  return location
}

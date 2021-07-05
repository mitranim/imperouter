/** Public API **/

export function find(str, routes) {
  valid(str, isStr)
  valid(routes, isArr)

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i]
    validRoute(route)

    const {reg} = route

    const match = reg.exec(str)
    if (!match) continue

    const groups = match.groups || Object.create(null)
    return {route, groups}
  }

  return {route: undefined, groups: undefined}
}

export function urlWithPathname (url, pathname) {return withUrl(url, setPathname, pathname)}
export function urlWithSearch   (url, search)   {return withUrl(url, setSearch,   search)}
export function urlWithHash     (url, hash)     {return withUrl(url, setHash,     hash)}

export function urlWithQuery   (url, query) {return withUrl(url, withUrlSearch, searchReplace, query)}
export function urlAppendQuery (url, query) {return withUrl(url, withUrlSearch, searchAppend,  query)}
export function urlPatchQuery  (url, query) {return withUrl(url, withUrlSearch, searchPatch,   query)}

export function urlMutReplaceQuery (url, query) {return withUrlSearch(url, searchReplace, query)}
export function urlMutAppendQuery  (url, query) {return withUrlSearch(url, searchAppend,  query)}
export function urlMutPatchQuery   (url, query) {return withUrlSearch(url, searchPatch,   query)}

export function searchReplace (search, query) {searchClear(search); return searchAppend(search, query)}
export function searchAppend  (search, query) {return searchUpdate(search, searchAppendProp, query)}
export function searchPatch   (search, query) {return searchUpdate(search, searchPatchProp, query)}

export function withUrl(url, fun, ...args) {
  url = toUrl(url)
  return urlStr(fun(url, ...args) || url)
}

export function urlQuery(url) {
  return searchQuery((isInst(url, URL) ? url : toUrl(url)).searchParams)
}

export function searchQuery(search) {
  validSearch(search)
  const out = {}
  for (const key of search.keys()) out[key] = search.getAll(key)
  return out
}

/** Internal Utils **/

/*
Note: regexps with a "global" flag preserve state between calls to `.exec` or
`.test`. They also produce surprising output with `String.prototype.match`.
There are ways to reset the state, but it seems cleaner to avoid the hazard in
the first place.
*/
function validRoute(val) {
  valid(val, isStruct)
  const {reg} = val
  if (!isReg(reg)) throw Error(`routes must have a regexp ".reg", got ${show(val)}`)
  if (reg.global) throw Error(`route regexps must not have a global flag, got ${reg}`)
}

function toUrl(val) {
  if (isStr(val)) return new URL(val, 'file:')
  validUrl(val)
  return new URL(val)
}

function urlStr(val) {
  if (val.protocol === 'file:') return val.pathname + val.search + val.hash
  return val.href
}

function withUrlSearch(url, fun, ...args) {
  validUrl(url)
  fun(url.searchParams, ...args)
  return url
}

function setPathname(url, pathname) {url.pathname = str(pathname)}
function setSearch(url, search) {url.search = str(search)}
function setHash(url, hash) {url.hash = str(hash)}

function searchClear(search) {
  validSearch(search)
  search.forEach(searchDelete)
}

function searchDelete(_val, key, search) {
  validSearch(search)
  search.delete(key)
}

function searchUpdate(search, fun, query) {
  query = dict(query)
  for (const key in query) fun(search, key, query[key])
  return search
}

function searchPatchProp(search, key, val) {
  search.delete(key)
  searchAppendProp(search, key, val)
}

function searchAppendProp(search, key, val) {
  if (isArr(val)) for (const elem of val) searchAppendVal(search, key, elem)
  else searchAppendVal(search, key, val)
}

function searchAppendVal(search, key, val) {
  if (isNil(val)) return
  if (isDate(val)) {
    search.append(key, val.toISOString())
    return
  }
  valid(val, isPrim)
  search.append(key, val)
}

function isNil(val)       {return val == null}
function isStr(val)       {return typeof val === 'string'}
function isPrim(val)      {return !isComp(val)}
function isComp(val)      {return isObj(val) || isFun(val)}
function isFun(val)       {return typeof val === 'function'}
function isObj(val)       {return val !== null && typeof val === 'object'}
function isArr(val)       {return isInst(val, Array)}
function isReg(val)       {return isInst(val, RegExp)}
function isDate(val)      {return isInst(val, Date)}
function isStruct(val)    {return isObj(val) && !isArr(val) && !isInst(val, String)}
function isInst(val, Cls) {return isComp(val) && val instanceof Cls}

function isDict(val) {
  if (!isObj(val)) return false
  const proto = Object.getPrototypeOf(val)
  return proto === null || proto === Object.prototype
}

function str(val)        {return isNil(val) ? '' : only(val, isStr)}
function dict(val)       {return isNil(val) ? {} : only(val, isDict)}
function only(val, test) {valid(val, test); return val}

function valid(val, test) {
  if (!test(val)) throw Error(`expected ${show(val)} to satisfy test ${show(test)}`)
}

function validInst(val, Cls) {
  if (!isInst(val, Cls)) {
    throw Error(`expected ${show(val)} to be an instance of ${show(Cls)}`)
  }
}

function validUrl(val)    {validInst(val, URL)}
function validSearch(val) {validInst(val, URLSearchParams)}

function show(val) {
  if (isFun(val) && val.name) return val.name
  if (isArr(val) || isDict(val) || isStr(val)) return JSON.stringify(val)
  return String(val)
}

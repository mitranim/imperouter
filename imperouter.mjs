/** Public API **/

export const GET     = 'GET'
export const HEAD    = 'HEAD'
export const OPTIONS = 'OPTIONS'
export const POST    = 'POST'
export const PUT     = 'PUT'
export const PATCH   = 'PATCH'
export const DELETE  = 'DELETE'

export class Router extends Request {
  constructor() {
    super(...arguments)
    fixProto(this, new.target)
    publicFinal(this, 'url', new URL(this.url))
  }

  preflight(fun = empty) {
    valid(fun, isFun)
    return (this.isMeth(HEAD) || this.isMeth(OPTIONS)) ? fun(this) : undefined
  }

  sub(reg, fun) {
    valid(fun, isFun)
    return this.testAny(reg) ? this.either(fun, notFound) : undefined
  }

  meths(reg, fun) {
    valid(fun, isFun)
    return this.testAny(reg) ? this.either(fun, notAllowed) : undefined
  }

  meth(method, reg, fun) {
    valid(reg, isReg)
    valid(fun, isFun)
    return this.isMeth(method) ? this.any(reg, fun) : undefined
  }

  any(reg, fun) {
    valid(fun, isFun)
    const match = this.matchAny(reg)
    return (match || undefined) && fun(this, match.groups)
  }

  get(reg, fun) {return this.meth(GET, reg, fun)}
  head(reg, fun) {return this.meth(HEAD, reg, fun)}
  options(reg, fun) {return this.meth(OPTIONS, reg, fun)}
  post(reg, fun) {return this.meth(POST, reg, fun)}
  put(reg, fun) {return this.meth(PUT, reg, fun)}
  patch(reg, fun) {return this.meth(PATCH, reg, fun)}
  delete(reg, fun) {return this.meth(DELETE, reg, fun)}

  only(...methods) {
    return methods.some(this.isMeth, this) ? undefined : notAllowed(this)
  }

  onlyGet() {return this.only(GET)}
  onlyHead() {return this.only(HEAD)}
  onlyOptions() {return this.only(OPTIONS)}
  onlyPost() {return this.only(POST)}
  onlyPut() {return this.only(PUT)}
  onlyPatch() {return this.only(PATCH)}
  onlyDelete() {return this.only(DELETE)}

  test(method, reg) {
    valid(reg, isReg)
    return this.isMeth(method) ? this.testAny(reg) : undefined
  }

  testAny(reg) {
    valid(reg, isReg)
    reg.lastIndex = 0
    return reg.test(this.url.pathname)
  }

  match(method, reg) {
    valid(reg, isReg)
    return this.isMeth(method) ? this.matchAny(reg) : undefined
  }

  matchAny(reg) {
    valid(reg, isReg)
    reg.lastIndex = 0
    return this.url.pathname.match(reg)
  }

  either(fun, def) {
    valid(def, isFun)
    const val = fun(this)
    return isPromise(val) ? eitherAsync(val, def, this) : (val || def(this))
  }

  isMeth(val) {return this.method === valid(val, isStr)}

  get [Symbol.toStringTag]() {return this.constructor.name}
}

export function notAllowed({url, method}) {
  const {pathname} = new URL(url)
  return new Response(`method ${method} not allowed for path ${pathname}`, {status: 405})
}

export function notFound({url, method}) {
  const {pathname} = new URL(url)
  return new Response(`no endpoint for ${method} ${pathname}`, {status: 404})
}

export function empty() {return new Response()}

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

async function eitherAsync(val, fun, ...args) {
  return (await val) || fun(...args)
}

function toUrl(val) {
  if (isStr(val)) return new URL(val, 'file:')
  return new URL(validUrl(val))
}

function urlStr(val) {
  validUrl(url)
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
  const keys = [...search.keys()]
  keys.forEach(deleteAt, search)
}

function deleteAt(key) {this.delete(key)}

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

/*
In some Safari versions, when instantiating a subclass of `Request`, the engine
incorrectly sets the instance's prototype to `Request.prototype`, instead of
the prototype of the subclass. This also happens for `Response`, `URL`, and a
variety of other built-ins. Occurs in Safari 12-14, both desktop and mobile.
*/
function fixProto(ref, {prototype}) {
  if (Object.getPrototypeOf(ref) === prototype) return
  Object.setPrototypeOf(ref, prototype)
}

function publicFinal(ref, key, val) {
  Object.defineProperty(ref, key, {
    value: val,
    enumerable: true,
    writable: false,
    configurable: true,
  })
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
function isPromise(val)   {return isComp(val) && isFun(val.then) && isFun(val.catch)}
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
  if (!test(val)) throw TypeError(`expected ${show(val)} to satisfy test ${show(test)}`)
  return val
}

function validInst(val, Cls) {
  if (!isInst(val, Cls)) {
    throw TypeError(`expected ${show(val)} to be an instance of ${show(Cls)}`)
  }
  return val
}

function validUrl(val)    {return validInst(val, URL)}
function validSearch(val) {return validInst(val, URLSearchParams)}

function show(val) {
  if (isFun(val) && val.name) return val.name
  if (isArr(val) || isDict(val) || isStr(val)) return JSON.stringify(val)
  return String(val)
}

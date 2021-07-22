/// <reference types="./imperouter.d.ts" />

/** Public API **/

export const GET     = 'GET'
export const HEAD    = 'HEAD'
export const OPTIONS = 'OPTIONS'
export const POST    = 'POST'
export const PUT     = 'PUT'
export const PATCH   = 'PATCH'
export const DELETE  = 'DELETE'

// Optional. May slightly improve performance. Needs benchmarks.
export class Req extends Request {
  constructor() {
    super(...arguments)
    fixProto(this, new.target)
    this.URL = new URL(this.url)
  }
}

export function preflight(req, fun = empty) {
  valid(fun, isFun)
  return (isMethod(req, HEAD) || isMethod(req, OPTIONS)) ? fun(req) : undefined
}

export function sub(req, reg, fun) {
  valid(fun, isFun)
  return testAny(req, reg) ? either(req, fun, notFound) : undefined
}

export function methods(req, reg, fun) {
  valid(fun, isFun)
  return testAny(req, reg) ? either(req, fun, notAllowed) : undefined
}

export function method(req, method, reg, fun) {
  valid(reg, isReg)
  valid(fun, isFun)
  return isMethod(req, method) ? any(req, reg, fun) : undefined
}

export function any(req, reg, fun) {
  valid(fun, isFun)
  const match = matchAny(req, reg)
  return (match || undefined) && fun(req, match.groups)
}

export function get     (req, reg, fun) {return method(req, GET,     reg, fun)}
export function head    (req, reg, fun) {return method(req, HEAD,    reg, fun)}
export function options (req, reg, fun) {return method(req, OPTIONS, reg, fun)}
export function post    (req, reg, fun) {return method(req, POST,    reg, fun)}
export function put     (req, reg, fun) {return method(req, PUT,     reg, fun)}
export function patch   (req, reg, fun) {return method(req, PATCH,   reg, fun)}
export function del     (req, reg, fun) {return method(req, DELETE,  reg, fun)}

export function only(req, ...methods) {
  valid(req, isReq)
  return methods.some(isMethAt, req) ? undefined : notAllowed(req)
}

export function onlyGet(req)     {return only(req, GET)}
export function onlyHead(req)    {return only(req, HEAD)}
export function onlyOptions(req) {return only(req, OPTIONS)}
export function onlyPost(req)    {return only(req, POST)}
export function onlyPut(req)     {return only(req, PUT)}
export function onlyPatch(req)   {return only(req, PATCH)}
export function onlyDelete(req)  {return only(req, DELETE)}

export function test(req, method, reg) {
  valid(reg, isReg)
  return isMethod(req, method) ? testAny(req, reg) : undefined
}

export function testAny(req, reg) {
  valid(req, isReq)
  valid(reg, isReg)
  reg.lastIndex = 0
  return reg.test(reqPathname(req))
}

export function match(req, method, reg) {
  valid(reg, isReg)
  return isMethod(req, method) ? matchAny(req, reg) : undefined
}

export function matchAny(req, reg) {
  valid(req, isReq)
  valid(reg, isReg)
  reg.lastIndex = 0
  return reqPathname(req).match(reg)
}

export function either(req, fun, def) {
  valid(req, isReq)
  valid(def, isFun)
  const val = fun(req)
  return isPromise(val) ? eitherAsync(val, def, req) : (val || def(req))
}

export function isMethod(req, val) {
  return valid(req, isReq).method === valid(val, isStr)
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
  validUrl(val)
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

// TODO: need benchmarks to compare pre-parsed URL vs repeated custom parsing vs
// repeated parsing via `new URL`.
function reqPathname(req) {
  valid(req, isReq)
  if (isInst(req, Req)) return req.URL.pathname
  return onlyPathname(dropProtocol(dropSearch(dropHash(req.url))))
}

function dropAt(str, suff) {
  const index = str.indexOf(suff)
  return index >= 0 ? str.slice(0, index) : str
}

function startAt(str, start) {
  const index = str.indexOf(start)
  return index >= 0 ? str.slice(index) : ''
}

function dropProtocol(str) {
  const part = '://'
  const index = str.indexOf(part)
  return index >= 0 ? str.slice(index + part.length) : str
}

function onlyPathname(str) {return startAt(str, '/')}
function dropSearch(str) {return dropAt(str, '?')}
function dropHash(str) {return dropAt(str, '#')}

function isMethAt(val) {return isMethod(this, val)}

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
function isReq(val)       {return isObj(val) && isStr(val.url) && isStr(val.method)}
function isInst(val, Cls) {return isComp(val) && val instanceof Cls}

function isDict(val) {
  if (!isObj(val)) return false
  const proto = Object.getPrototypeOf(val)
  return proto === null || proto === Object.prototype
}

function str(val)  {return isNil(val) ? '' : valid(val, isStr)}
function dict(val) {return isNil(val) ? {} : valid(val, isDict)}

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

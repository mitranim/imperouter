/// <reference types="./imperouter.d.ts" />

/** Public API **/

export const GET     = `GET`
export const HEAD    = `HEAD`
export const OPTIONS = `OPTIONS`
export const POST    = `POST`
export const PUT     = `PUT`
export const PATCH   = `PATCH`
export const DELETE  = `DELETE`

// Optional. Should improve routing performance. Needs benchmarks.
export class Req extends Request {
  constructor() {
    super(...arguments)
    fixProto(this, new.target)
    this.URL = new URL(this.url)
  }

  get [Symbol.toStringTag]() {return this.constructor.name}
}

export function preflight(req, fun = empty) {
  valid(fun, isFun)
  return (isMethod(req, HEAD) || isMethod(req, OPTIONS)) ? fun(req) : undefined
}

export function sub(req, pat, fun) {
  valid(fun, isFun)
  return testAny(req, pat) ? either(req, fun, notFound) : undefined
}

export function methods(req, pat, fun) {
  valid(fun, isFun)
  return testAny(req, pat) ? either(req, fun, notAllowed) : undefined
}

export function method(req, method, pat, fun) {
  valid(pat, isPat)
  valid(fun, isFun)
  return isMethod(req, method) ? any(req, pat, fun) : undefined
}

export function any(req, pat, fun) {
  valid(fun, isFun)
  const match = matchAny(req, pat)
  return (match || undefined) && fun(req, match.groups)
}

export function get(req, pat, fun) {return method(req, GET, pat, fun)}
export function head(req, pat, fun) {return method(req, HEAD, pat, fun)}
export function options(req, pat, fun) {return method(req, OPTIONS, pat, fun)}
export function post(req, pat, fun) {return method(req, POST, pat, fun)}
export function put(req, pat, fun) {return method(req, PUT, pat, fun)}
export function patch(req, pat, fun) {return method(req, PATCH, pat, fun)}
export function del(req, pat, fun) {return method(req, DELETE, pat, fun)}

export function only(req, ...methods) {
  valid(req, isReq)
  return methods.some(isMethAt, req) ? undefined : notAllowed(req)
}

export function onlyGet(req) {return only(req, GET)}
export function onlyHead(req) {return only(req, HEAD)}
export function onlyOptions(req) {return only(req, OPTIONS)}
export function onlyPost(req) {return only(req, POST)}
export function onlyPut(req) {return only(req, PUT)}
export function onlyPatch(req) {return only(req, PATCH)}
export function onlyDelete(req) {return only(req, DELETE)}

export function test(req, method, pat) {
  valid(pat, isPat)
  return isMethod(req, method) ? testAny(req, pat) : undefined
}

export function testAny(req, pat) {
  const pathname = reqPathname(req)
  if (isStr(pat)) return pathname === pat
  return reg(pat).test(pathname)
}

export function match(req, method, pat) {
  valid(pat, isPat)
  return isMethod(req, method) ? matchAny(req, pat) : undefined
}

export function matchAny(req, pat) {
  const pathname = reqPathname(req)
  if (isStr(pat)) return pathname === pat ? [pathname] : null
  return pathname.match(reg(pat))
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

export function error(err) {
  return new Response(err?.stack || err?.message || `unknown error`, {status: 500})
}

export function empty() {return new Response()}

/** Internal Utils **/

async function eitherAsync(val, fun, ...args) {
  return (await val) || fun(...args)
}

function isMethAt(val) {return isMethod(this, val)}

/*
In some Safari versions, when instantiating a subclass of `Request`, the engine
incorrectly sets the instance's prototype to `Request.prototype`, instead of
the prototype of the subclass. This also happens for `Response`, `URL`, and a
variety of other built-ins. Occurs in Safari 12-14, both desktop and mobile.
*/
export function fixProto(ref, {prototype}) {
  if (Object.getPrototypeOf(ref) === prototype) return
  Object.setPrototypeOf(ref, prototype)
}

function reg(val) {
  valid(val, isReg)
  val.lastIndex = 0
  return val
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

function isFun(val) {return typeof val === `function`}
function isStr(val) {return typeof val === `string`}
function isComp(val) {return isObj(val) || isFun(val)}
function isObj(val) {return !isNull(val) && typeof val === `object`}
function isNull(val) {return val === null} // eslint-disable-line eqeqeq
function isPromise(val) {return hasMeth(val, `then`)}
function isReg(val) {return isInst(val, RegExp)}
function isInst(val, cls) {return isObj(val) && val instanceof cls}
function isReq(val) {return isObj(val) && isStr(val.url) && isStr(val.method)}
function isPat(val) {return isStr(val) || isReg(val)}

function hasMeth(val, key) {return isFun(read(val, key))}

function valid(val, fun) {
  if (!fun(val)) {
    throw TypeError(`expected ${show(val)} to satisfy test ${fun.name}`)
  }
  return val
}

function show(val) {
  if (isStr(val)) return JSON.stringify(val)
  if (isFun(val)) return showFun(val)
  if (isObj(val)) return showObj(val)
  return val + ``
}

function showFun(val) {return `[function ${val.name || val}]`}

function showObj(val) {
  const con = readCon(val)
  if (!con || con === Object || con === Array) return JSON.stringify(val)
  const name = readName(con)
  return name ? `[object ${name}]` : val + ``
}

function read(val, key) {return isComp(val) && key in val ? val[key] : undefined}
function readCon(val) {return read(val, `constructor`)}
function readName(val) {return read(val, `name`)}

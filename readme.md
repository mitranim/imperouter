## Overview

Imperative router for hybrid SSR+SPA apps. Uses the standard built-in [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) and [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL) APIs. Works as-is in [Deno](https://deno.land) and browsers. Requires a `Request` polyfill in Node.

Similar to the Go router [`rout`](https://github.com/mitranim/rout).

Features:

  * Simple, expressive router for SSR+SPA. Subclass of `Request`.
  * Utility functions for URL manipulation, including query encoding/decoding.
  * Imperative control.
  * Freedom to route by method, path, or both.
  * Abstract, usable for server-side routing or with any UI library.
  * Uses regexps and named capture groups. No custom dialects.

Tiny, dependency-free, single file, native module.

## TOC

* [Overview](#overview)
* [Why](#why)
* [Usage](#usage)
* [API](#api)
  * [`class Router`](#class-router-extends-request)
    * [`property router.url`](#property-routerurl)
    * [`method router.preflight`](#method-routerpreflightfun--empty)
    * [`method router.sub`](#method-routersubreg-fun)
    * [`method router.meths`](#method-routermethsreg-fun)
    * [`method router.meth`](#method-routermethmethod-reg-fun)
    * [`method router.any`](#method-routeranyreg-fun)
    * [`method router.get`](#method-routergetreg-fun)
    * [`method router.head`](#method-routerheadreg-fun)
    * [`method router.options`](#method-routeroptionsreg-fun)
    * [`method router.post`](#method-routerpostreg-fun)
    * [`method router.put`](#method-routerputreg-fun)
    * [`method router.patch`](#method-routerpatchreg-fun)
    * [`method router.delete`](#method-routerdeletereg-fun)
    * [`Router` undocumented](#router-undocumented)
  * [`function empty`](#function-empty)
  * [`function notFound`](#function-notfoundreq)
  * [`function notAllowed`](#function-notallowedreq)
  * [`function urlWithPathname`](#function-urlwithpathnameurl-pathname--string)
  * [`function urlWithSearch`](#function-urlwithsearchurl-search--string)
  * [`function urlWithHash`](#function-urlwithhashurl-hash--string)
  * [`function urlWithQuery`](#function-urlwithqueryurl-query--string)
  * [`function urlAppendQuery`](#function-urlappendqueryurl-query--string)
  * [`function urlPatchQuery`](#function-urlpatchqueryurl-query--string)
  * [`function urlMutReplaceQuery`](#function-urlmutreplacequeryurl-query--url)
  * [`function urlMutAppendQuery`](#function-urlmutappendqueryurl-query--url)
  * [`function urlMutPatchQuery`](#function-urlmutpatchqueryurl-query--url)
  * [`function searchReplace`](#function-searchreplacesearch-query--urlsearchparams)
  * [`function searchAppend`](#function-searchappendsearch-query--urlsearchparams)
  * [`function searchPatch`](#function-searchpatchsearch-query--urlsearchparams)
  * [`function withUrl`](#function-withurlurl-fun-args--string)
  * [`function urlQuery`](#function-urlqueryurl--string-string--string)
  * [`function searchQuery`](#function-searchquerysearch--string-string--string)
  * [Undocumented](#undocumented)
* [Do and Don't](#do-and-dont)
* [Changelog](#changelog)
* [Misc](#misc)

## Why

Instead of replacing or wrapping standard interfaces, Imperouter lets you work _directly_ with the built-in `Request` and `URL` APIs, extending what you can do with them.

Imperouter uses imperative, procedural control flow. It does not have, and _does not need_, any kind of "middleware" or "interceptors".

Imperouter uses regexps and named capture groups. No string-based dialect, no surprises.

Imperouter does not use any URL mounting, joining, or rewriting. You always match the full pathname, and receive the full URL, including the origin. This allows you to understand full routes on a glance, search them in your editor, and benefit from the standard `URL` interface.

## Usage

Install with NPM, or import by URL:

```sh
npm i -E imperouter
```

```js
import * as ir from 'imperouter'

import * as ir from 'https://cdn.jsdelivr.net/npm/imperouter@0.7.0/imperouter.mjs'
```

Example with Deno:

```js
import * as ir from 'imperouter'

function respond(event) {
  const req = new ir.Router(event.request)
  event.respondWith(response(req))
}

function response(req) {
  return (
    req.preflight() ||
    req.sub(/^[/]api(?:[/]|$)/, apiRoutes) ||
    req.sub(/(?:)/,             pageRoutes)
  )
}

// Because of `.sub()`, if there's no match, this is 404.
async function apiRoutes(req) {
  return cors(await (
    req.meths(/^[/]api[/]posts$/, postRoot) ||
    req.meths(/^[/]api[/]posts[/](?<id>[^/]+)$/, postById)
  ))
}

// Because of `.meths()`, if there's no match, this is 405.
function postRoot(req) {
  return (
    req.get(/^[/]api[/]posts$/, postFeed) ||
    req.post(/^[/]api[/]posts$/, postCreate)
  )
}

// Because of `.meths()`, if there's no match, this is 405.
function postById(req) {
  return (
    req.get(/^[/]api[/]posts[/](?<id>[^/]+)$/, postGet) ||
    req.post(/^[/]api[/]posts[/](?<id>[^/]+)$/, postUpdate)
  )
}

// Because of `.sub()`, if there's no match, this is 404.
// But a website must have its own 404 route with an HTML page.
function pageRoutes(req) {
  return (
    req.get(/^[/]posts$/,               posts) ||
    req.get(/^[/]posts[/](?<id>[^/])$/, post)  ||
    req.get(/(?:)/,                     notFound)
  )
}

function postFeed(req)         {return new Response(`path: ${req.url.pathname}`)}
function postCreate(req)       {return new Response(`path: ${req.url.pathname}`)}
function postGet(req, {id})    {return new Response(`path: ${req.url.pathname}`)}
function postUpdate(req, {id}) {return new Response(`path: ${req.url.pathname}`)}
function posts(req)            {return new Response(`path: ${req.url.pathname}`)}
function post(req, {id})       {return new Response(`path: ${req.url.pathname}`)}

function notFound(req)         {
  return new Response(`not found: ${req.url.pathname}`, {status: 404})
}

function cors(res) {
  res.headers.set('access-control-allow-credentials', 'true')
  res.headers.set('access-control-allow-headers', 'cache-control, content-type')
  res.headers.set('access-control-allow-methods', 'OPTIONS, GET, HEAD, POST, PUT, PATCH, DELETE')
  res.headers.set('access-control-allow-origin', '*')
  return res
}
```

## API

All examples imply an import:

```js
import * as ir from 'imperouter'
```

### `class Router extends Request`

Extends the standard [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) interface, adding convenience shortcuts for routing.

Because a router _is_ a `Request`, you can make one from an existing request (in Deno for SSR), or from scratch (in browsers for pushstate). You can also subclass `Router`, adding your own properties or methods.

```js
// In Deno.
req = new ir.Router(req)

// In browsers, for pushstate routing.
const req = new ir.Router(window.location)
```

#### `property router.url`

Unlike the `url` property on a standard `Request` instance, `router.url` is not a string. It's an instance of [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL). All regexp-based router methods match against `router.url.pathname`. All other properties are inherited from [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request).

#### `method router.preflight(fun = empty)`

If `req.method` matches `HEAD` or `OPTIONS`, generate a response, default [`empty`](#function-empty). Otherwise, return nil. See [Usage](#usage). You can also pass a different function:

```js
req.preflight(preflight) || otherRoutes(req)

function preflight(req) {return new Response(`ok to proceed`)}
```

#### `method router.sub(reg, fun)`

If `req.url.pathname` matches `reg`, _then_ `fun(req) || notFound(req)`, async if needed. Otherwise nil. Ensures that once we match a branch, we definitely return a response, falling back on 404 "not found", and without trying any other branches. See [Usage](#usage).

```js
req.sub(/^[/]api(?:[/]|$)/, apiRoutes) ||
req.sub(/(?:)/,             pageRoutes)
```

#### `method router.meths(reg, fun)`

Similar to [`router.sub`](#method-routersubreg-fun), but 405. If `req.url.pathname` matches `reg`, _then_ `fun(req) || notAllowed(req)`, async if needed. Otherwise nil. Ensures that once we match a branch, we definitely return a response, falling back on 405 "method not allowed", and without trying any other branches. See [Usage](#usage).

```js
req.meths(/^[/]api[/]posts$/, postRoot) || otherRoutes(req)

function postRoot(req) {
  return (
    req.get(/^[/]api[/]posts$/, postFeed) ||
    req.post(/^[/]api[/]posts$/, postCreate)
  )
}
```

#### `method router.meth(method, reg, fun)`

If `req.method` matches `method` _and_ `req.url.pathname` matches `reg`, _then_ `fun(req, groups)`, where `groups` are named capture groups from the regexp. Otherwise nil.

`Router` already comes with shortcuts such as [`router.get`](#method-routergetreg-fun). You should only need `router.meth` when overriding methods in a subclass, or when routing on unusual or custom HTTP methods.

To match any path, use `/(?:)/`:

```js
req.meth('someHttpMethod', /(?:)/, someFun) || otherRoutes(req)
```

#### `method router.any(reg, fun)`

If `req.url.pathname` matches `reg`, _then_ `fun(req, groups)`, where `groups` are named capture groups from the regexp. Otherwise nil.

```js
// 404 on unknown file requests.
req.any(/[.]\w+$/, ir.notFound) || otherRoutes(req)
```

#### `method router.get(reg, fun)`

Shortcut for `req.meth(ir.GET, fun)`. See [`router.meth`](#method-routermethmethod-reg-fun) and [Usage](#usage).

#### `method router.head(reg, fun)`

Shortcut for `req.meth(ir.HEAD, fun)`. See [`router.meth`](#method-routermethmethod-reg-fun) and [Usage](#usage).

#### `method router.options(reg, fun)`

Shortcut for `req.meth(ir.OPTIONS, fun)`. See [`router.meth`](#method-routermethmethod-reg-fun) and [Usage](#usage).

#### `method router.post(reg, fun)`

Shortcut for `req.meth(ir.POST, fun)`. See [`router.meth`](#method-routermethmethod-reg-fun) and [Usage](#usage).

#### `method router.put(reg, fun)`

Shortcut for `req.meth(ir.PUT, fun)`. See [`router.meth`](#method-routermethmethod-reg-fun) and [Usage](#usage).

#### `method router.patch(reg, fun)`

Shortcut for `req.meth(ir.PATCH, fun)`. See [`router.meth`](#method-routermethmethod-reg-fun) and [Usage](#usage).

#### `method router.delete(reg, fun)`

Shortcut for `req.meth(ir.DELETE, fun)`. See [`router.meth`](#method-routermethmethod-reg-fun) and [Usage](#usage).

#### `Router` undocumented

`Router` has useful methods that are undocumented to avoid bloating the docs. Check the [source code](imperouter.mjs), it's extremely simple.

### `function empty()`

Shortcut for `new Response()`, which is a valid empty response. Default in [`router.preflight`](#method-routerpreflightfun--empty).

### `function notFound(req)`

Shortcut for an extremely simple 404 response. Fallback in [`router.sub`](#method-routersubreg-fun).

### `function notAllowed(req)`

Shortcut for an extremely simple 405 response. Fallback in [`router.meths`](#method-routermethsreg-fun).

### `urlWithPathname(url, pathname)` → `string`

Swaps the URL's pathname without affecting other properties. Returns a string. The input may be `string | URL` and is not mutated. The input may be "relative": without an origin.

```js
console.log(ir.urlWithPathname('/one?two=three#four', 'five'))
// '/five/?two=three#four'
```

### `urlWithSearch(url, search)` → `string`

Like `urlWithPathname`, but swaps the URL's search string:

```js
console.log(ir.urlWithSearch('/one?two=three#four', 'five'))
// '/one/?five#four'
```

### `urlWithHash(url, hash)` → `string`

Like `urlWithPathname`, but swaps the URL's hash string:

```js
console.log(ir.urlWithHash('/one?two=three#four', 'five'))
// '/one?two=three#five'
```

### `urlWithQuery(url, query)` → `string`

Replaces the URL's search params with the provided query, which must be a dict. Encoding rules:

* `null` and `undefined` are ignored.
* `Array` is appended as a collection (each value separately).
* `Date` is encoded via `.toISOString()`.
* Primitives are automatically stringified.
* Other types are rejected with an exception, to prevent gotchas.

Returns a string. The input may be `string | URL` and is not mutated. The input may be "relative": without an origin.

```js
const query = {
  five: 'six',
  seven: ['eight', 'nine'],
  ten: undefined,
}

console.log(ir.urlWithQuery('/one?two=three#four', query))
// '/one?five=six&seven=eight&seven=nine#four'
```

### `urlAppendQuery(url, query)` → `string`

Like `urlWithQuery`, but preserves any previously-existing search params, appending the query to them.

```js
const query = {
  five: 'six',
  seven: ['eight', 'nine'],
  ten: undefined,
}

console.log(ir.urlAppendQuery('/one?two=three#four', query))
// '/one?two=three&five=six&seven=eight&seven=nine#four'
```

### `urlPatchQuery(url, query)` → `string`

Like `urlWithQuery`, but "patches" the search params, by preserving any which don't occur in the provided query, but replacing any that do occur.

```js
const query = {
  two: ['six', 'seven'],
  eight: 'nine',
}

console.log(ir.urlPatchQuery('/one?two=three&four=five', query))
// '/one?four=five&two=six&two=seven&eight=nine'
```

### `urlMutReplaceQuery(url, query)` → `URL`

Like `urlWithQuery` but mutates the provided `URL`, returning the same instance.

### `urlMutAppendQuery(url, query)` → `URL`

Like `urlAppendQuery` but mutates the provided `URL`, returning the same instance.

### `urlMutPatchQuery(url, query)` → `URL`

Like `urlPatchQuery` but mutates the provided `URL`, returning the same instance.

### `searchReplace(search, query)` → `URLSearchParams`

Mutates the provided `URLSearchParams`, replacing its params with the provided query, as described in `urlWithQuery`.

```js
const query = {
  five: 'six',
  seven: ['eight', 'nine'],
  ten: undefined,
}

const search = new URLSearchParams('two=three')
ir.searchReplace(search, query)

console.log(search.toString())
// 'five=six&seven=eight&seven=nine'
```

### `searchAppend(search, query)` → `URLSearchParams`

Mutates the provided `URLSearchParams`, appending the params from the provided query, as described in `urlAppendQuery`.

### `searchPatch(search, query)` → `URLSearchParams`

Mutates the provided `URLSearchParams`, patching it by the provided query, as described in `urlPatchQuery`.

### `withUrl(url, fun, ...args)` → `string`

Runs a function with a temporary URL instance parsed from the input, and returns the resulting string. The function should mutate the URL.

The function is `ƒ(url, ...args) → (void | URL)`. The external input may be `string | URL` and is _not_ mutated.

```js
const url = withUrl('/one?two#three', function(url) {
  url.search = 'four'
  url.hash = 'five'
})
console.log(url)
// '/one?four#five'
```

### `urlQuery(url)` → `{[string]: string | [string]}`

Extracts the URL's search params as a query dict. Opposite of `urlWithQuery`. The input may be `string | URL`.

```js
console.log(ir.urlQuery('/one?five=six&seven=eight&seven=nine#four'))
// { five: [ 'six' ], seven: [ 'eight', 'nine' ] }
```

### `searchQuery(search)` → `{[string]: string | [string]}`

Converts the search params, which must be `URLSearchParams`, into a query dict. Opposite of `searchReplace`.

```js
const search = new URLSearchParams('five=six&seven=eight&seven=nine')
console.log(searchQuery(search))
// { five: [ 'six' ], seven: [ 'eight', 'nine' ] }
```

### Undocumented

Some useful constants, functions, and methods are exported but undocumented to reduce doc bloat. Check the [source](imperouter.mjs).

## Do and Don't

Haven't ran benchmarks yet, but you should probably:

* Avoid local closures. Instead, define route handlers statically.
* Avoid large flat tables. Instead, structure your routes as trees.

Do:

```js
function response(req) {
  return (
    // Grouped-up. If no match, tested only once, regardless of how many
    // sub-routes it has.
    req.get(/^[/]posts(?:[/]|$)/, postRoutes) ||
    req.get(/(?:)/, notFound)
  )
}

function postRoutes(req) {
  return (
    req.get(/^[/]posts$/,               posts) ||
    req.get(/^[/]posts[/](?<id>[^/])$/, post)
  )
}

// Statically defined functions, no closures.
function posts(req) {}
function post(req, {id}) {}
function notFound(req) {}
```

Don't:

```js
// Single flat table. Multiple closures.
function response(req) {
  return (
    req.get(/^[/]posts$/,               req => {})         ||
    req.get(/^[/]posts[/](?<id>[^/])$/, (req, {id}) => {}) ||
    req.get(/(?:)/,                     req => {})
  )
}
```

## Changelog

### `0.6.1`

Bugfixes for query mutations. This affects all query-related functions.

### `0.6.0`

Breaking API revision: removed `match`, revised `find`.

`find` no longer deals with `URL` objects. It takes a plain string, runs routes against it, and returns `{route, groups}`.

Route regexp must be `route.reg`, rather than `route.path`. Imperouter attaches no special meaning to the string passed to it.

### `0.5.1`

Allow routes to be non-plain objects.

### `0.5.0`

Super breaking!

No more UI adapters.

No more `'history'` integration.

Using the native `URL` interface instead of `'history'`'s "location" dicts.

Added the previously-missing license (unlicense).

### `0.4.0`

Now provided only as native JS modules (`.mjs`).

### `0.3.1`

Bugfix for Preact: fixed incorrect unwrapping of `context.history`.

### `0.3.0`

Minor but potentially breaking changes:

* `<Link>` with `target='_blank'` acts like a standard `<a>`, does not trigger pushstate navigation
* `encodeQuery` no longer prepends `?`
* `params` now inherit from `null` rather than `Object.prototype`

Added feature:

* support ES2018 regexp named capture groups

### `0.2.0`

Added React adapter.

## License

https://unlicense.org

## Misc

I'm receptive to suggestions. If this library _almost_ satisfies you but needs changes, open an issue or chat me up. Contacts: https://mitranim.com/#contacts

## Overview

Imperative router for hybrid SSR+SPA apps. Uses the standard built-in [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) and [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL) APIs. Works as-is in [Deno](https://deno.land) and browsers. Requires `Request` and `Response` polyfills in Node.

Similar to the Go router [`rout`](https://github.com/mitranim/rout).

Features:

  * Simple, expressive router for SSR+SPA.
  * Only functions of `Request`, `Response`, and `URL`. No added abstractions.
  * Imperative control.
  * Freedom to route by method, path, or both.
  * Abstract, usable for server-side routing or with any UI library.
  * Uses regexps with named capture groups. Also allows strings for _exact_ matching. No custom string-based dialects.
  * Bonus: utility functions for URL manipulation, including query encoding/decoding.

Tiny, dependency-free, single file, native module.

## TOC

* [Overview](#overview)
* [Why](#why)
* [Usage](#usage)
* [API](#api)
  * [`class Req extends Request`](#class-req-extends-request)
    * [`property req.URL`](#property-requrl)
  * [`function preflight`](#function-preflightreq-fun--empty)
  * [`function sub`](#function-subreq-pat-fun)
  * [`function methods`](#function-methodsreq-pat-fun)
  * [`function method`](#function-methodreq-method-pat-fun)
  * [`function any`](#function-anyreq-pat-fun)
  * [`function get`](#function-getreq-pat-fun)
  * [`function head`](#function-headreq-pat-fun)
  * [`function options`](#function-optionsreq-pat-fun)
  * [`function post`](#function-postreq-pat-fun)
  * [`function put`](#function-putreq-pat-fun)
  * [`function patch`](#function-patchreq-pat-fun)
  * [`function del`](#function-delreq-pat-fun)
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

Imperouter uses regexps with named capture groups. It also allows strings for _exact_ matching. No custom string-based dialects, no surprises.

Imperouter does not use any URL mounting, joining, or rewriting. You always match the full pathname, and receive the full URL, including the origin. This allows you to understand full routes on a glance, search them in your editor, and benefit from the standard `URL` interface.

## Usage

Install with NPM, or import by URL:

```sh
npm i -E imperouter
```

```js
import * as r from 'imperouter'

import * as r from 'https://cdn.jsdelivr.net/npm/imperouter@0.8.3/imperouter.mjs'
```

Example with Deno:

```js
import * as r from 'imperouter'

function respond(event) {
  const req = new r.Req(event.request)
  event.respondWith(response(req))
}

function response(req) {
  return (
    r.preflight(req) ||
    r.sub(req, /^[/]api(?:[/]|$)/, apiRoutes) ||
    r.sub(req, /(?:)/,             pageRoutes)
  )
}

// Because of `sub`, if there's no match, this is 404.
async function apiRoutes(req) {
  return cors(await (
    r.methods(req, `/api/posts`,                      postRoot) ||
    r.methods(req, /^[/]api[/]posts[/](?<id>[^/]+)$/, postById)
  ))
}

// Because of `methods`, if there's no match, this is 405.
function postRoot(req) {
  return (
    r.get(req,  `/api/posts`, postFeed) ||
    r.post(req, `/api/posts`, postCreate)
  )
}

// Because of `methods`, if there's no match, this is 405.
function postById(req) {
  return (
    r.get(req,  /^[/]api[/]posts[/](?<id>[^/]+)$/, postGet) ||
    r.post(req, /^[/]api[/]posts[/](?<id>[^/]+)$/, postUpdate)
  )
}

// Because of `sub`, if there's no match, this is 404.
// But a website must have its own 404 route with an HTML page.
function pageRoutes(req) {
  return (
    r.get(req, `/posts`,                   posts) ||
    r.get(req, /^[/]posts[/](?<id>[^/])$/, post)  ||
    r.get(req, /(?:)/,                     notFound)
  )
}

function postFeed(req)         {return new Response(`url: ${req.url}`)}
function postCreate(req)       {return new Response(`url: ${req.url}`)}
function postGet(req, {id})    {return new Response(`url: ${req.url}`)}
function postUpdate(req, {id}) {return new Response(`url: ${req.url}`)}
function posts(req)            {return new Response(`url: ${req.url}`)}
function post(req, {id})       {return new Response(`url: ${req.url}`)}

function notFound(req)         {
  return new Response(`not found: ${req.url}`, {status: 404})
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
import * as r from 'imperouter'
```

### `class Req extends Request`

Optional subclass of standard [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request). Adds `req.URL` which can slightly improve routing performance by avoiding repeated parsing.

Make it from an existing request (in Deno for SSR), or from scratch (in browsers for pushstate). You can also subclass `Req`, adding your own properties or methods.

Completely optional. All routing functions work on standard `Request`.

```js
// In Deno.
req = new r.Req(req)

// In browsers, for pushstate routing.
const req = new r.Req(window.location)
```

#### `property req.URL`

Instance of [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL) created from `req.url`. All regexp-based functions in `imperouter` match against `req.URL.pathname` if available, which can slightly improve performance. Otherwise, they parse `req.url`.

### `function preflight(req, fun = empty)`

If `req.method` matches `HEAD` or `OPTIONS`, generate a response, default [`empty`](#function-empty). Otherwise, return nil. See [Usage](#usage). You can also pass a different function:

```js
r.preflight(req, preflight) || otherRoutes(req)

function preflight(req) {return new Response(`ok to proceed`)}
```

### `function sub(req, pat, fun)`

If pathname of `req.url` matches `pat`, _then_ `fun(req) || notFound(req)`, async if needed. Otherwise nil. Ensures that once we match a branch, we definitely return a response, falling back on 404 "not found", and without trying any other branches. See [Usage](#usage).

```js
r.sub(req, /^[/]api(?:[/]|$)/, apiRoutes) ||
r.sub(req, /(?:)/,             pageRoutes)
```

### `function methods(req, pat, fun)`

Similar to [`sub`](#function-subreq-pat-fun), but 405. If pathname of `req.url` matches `pat`, _then_ `fun(req) || notAllowed(req)`, async if needed. Otherwise nil. Ensures that once we match a branch, we definitely return a response, falling back on 405 "method not allowed", and without trying any other branches. See [Usage](#usage).

```js
r.methods(req, `/api/posts`, postRoot) || otherRoutes(req)

function postRoot(req) {
  return (
    r.get(req, `/api/posts`, postFeed) ||
    r.post(req, `/api/posts`, postCreate)
  )
}
```

### `function method(req, method, pat, fun)`

If `req.method` matches `method` _and_ pathname of `req.url` matches `pat`, _then_ `fun(req, groups)`, where `groups` are named capture groups from the pattern. Otherwise nil.

`imperouter` has shortcuts such as [`get`](#function-getreq-pat-fun). You should only need `method` for routing on unusual or custom HTTP methods.

To match any path, use `/(?:)/`:

```js
r.method(req, 'someHttpMethod', /(?:)/, someFun) || otherRoutes(req)
```

### `function any(req, pat, fun)`

If pathname of `req.url` matches `pat`, _then_ `fun(req, groups)`, where `groups` are named capture groups from the pattern. Otherwise nil.

```js
// 404 on unknown file requests.
r.any(req, /[.]\w+$/, r.notFound) || otherRoutes(req)
```

### `function get(req, pat, fun)`

Shortcut for `r.method(req, r.GET, fun)`. See [`method`](#function-methodreq-method-pat-fun) and [Usage](#usage).

### `function head(req, pat, fun)`

Shortcut for `r.method(req, r.HEAD, fun)`. See [`method`](#function-methodreq-method-pat-fun) and [Usage](#usage).

### `function options(req, pat, fun)`

Shortcut for `r.method(req, r.OPTIONS, fun)`. See [`method`](#function-methodreq-method-pat-fun) and [Usage](#usage).

### `function post(req, pat, fun)`

Shortcut for `r.method(req, r.POST, fun)`. See [`method`](#function-methodreq-method-pat-fun) and [Usage](#usage).

### `function put(req, pat, fun)`

Shortcut for `r.method(req, r.PUT, fun)`. See [`method`](#function-methodreq-method-pat-fun) and [Usage](#usage).

### `function patch(req, pat, fun)`

Shortcut for `r.method(req, r.PATCH, fun)`. See [`method`](#function-methodreq-method-pat-fun) and [Usage](#usage).

### `function del(req, pat, fun)`

Shortcut for `r.method(req, r.DELETE, fun)`. See [`method`](#function-methodreq-method-pat-fun) and [Usage](#usage).

### `function empty()`

Shortcut for `new Response()`, which is a valid empty response. Default in [`preflight`](#function-preflightreq-fun--empty).

### `function notFound(req)`

Shortcut for an extremely simple 404 response. Fallback in [`sub`](#function-subreq-pat-fun).

### `function notAllowed(req)`

Shortcut for an extremely simple 405 response. Fallback in [`methods`](#function-methodsreq-pat-fun).

### `function urlWithPathname(url, pathname)` → `string`

Swaps the URL's pathname without affecting other properties. Returns a string. The input may be `string | URL` and is not mutated. The input may be "relative": without an origin.

```js
console.log(r.urlWithPathname('/one?two=three#four', 'five'))
// '/five/?two=three#four'
```

### `function urlWithSearch(url, search)` → `string`

Like `urlWithPathname`, but swaps the URL's search string:

```js
console.log(r.urlWithSearch('/one?two=three#four', 'five'))
// '/one/?five#four'
```

### `function urlWithHash(url, hash)` → `string`

Like `urlWithPathname`, but swaps the URL's hash string:

```js
console.log(r.urlWithHash('/one?two=three#four', 'five'))
// '/one?two=three#five'
```

### `function urlWithQuery(url, query)` → `string`

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

console.log(r.urlWithQuery('/one?two=three#four', query))
// '/one?five=six&seven=eight&seven=nine#four'
```

### `function urlAppendQuery(url, query)` → `string`

Like `urlWithQuery`, but preserves any previously-existing search params, appending the query to them.

```js
const query = {
  five: 'six',
  seven: ['eight', 'nine'],
  ten: undefined,
}

console.log(r.urlAppendQuery('/one?two=three#four', query))
// '/one?two=three&five=six&seven=eight&seven=nine#four'
```

### `function urlPatchQuery(url, query)` → `string`

Like `urlWithQuery`, but "patches" the search params, by preserving any which don't occur in the provided query, but replacing any that do occur.

```js
const query = {
  two: ['six', 'seven'],
  eight: 'nine',
}

console.log(r.urlPatchQuery('/one?two=three&four=five', query))
// '/one?four=five&two=six&two=seven&eight=nine'
```

### `function urlMutReplaceQuery(url, query)` → `URL`

Like `urlWithQuery` but mutates the provided `URL`, returning the same instance.

### `function urlMutAppendQuery(url, query)` → `URL`

Like `urlAppendQuery` but mutates the provided `URL`, returning the same instance.

### `function urlMutPatchQuery(url, query)` → `URL`

Like `urlPatchQuery` but mutates the provided `URL`, returning the same instance.

### `function searchReplace(search, query)` → `URLSearchParams`

Mutates the provided `URLSearchParams`, replacing its params with the provided query, as described in `urlWithQuery`.

```js
const query = {
  five: 'six',
  seven: ['eight', 'nine'],
  ten: undefined,
}

const search = new URLSearchParams('two=three')
r.searchReplace(search, query)

console.log(search.toString())
// 'five=six&seven=eight&seven=nine'
```

### `function searchAppend(search, query)` → `URLSearchParams`

Mutates the provided `URLSearchParams`, appending the params from the provided query, as described in `urlAppendQuery`.

### `function searchPatch(search, query)` → `URLSearchParams`

Mutates the provided `URLSearchParams`, patching it by the provided query, as described in `urlPatchQuery`.

### `function withUrl(url, fun, ...args)` → `string`

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

### `function urlQuery(url)` → `{[string]: string | [string]}`

Extracts the URL's search params as a query dict. Opposite of `urlWithQuery`. The input may be `string | URL`.

```js
console.log(r.urlQuery('/one?five=six&seven=eight&seven=nine#four'))
// { five: [ 'six' ], seven: [ 'eight', 'nine' ] }
```

### `function searchQuery(search)` → `{[string]: string | [string]}`

Converts the search params, which must be `URLSearchParams`, into a query dict. Opposite of `searchReplace`.

```js
const search = new URLSearchParams('five=six&seven=eight&seven=nine')
console.log(searchQuery(search))
// { five: [ 'six' ], seven: [ 'eight', 'nine' ] }
```

### Undocumented

Some useful constants and functions are exported but undocumented to reduce doc bloat. Check the [source](imperouter.mjs) or the [type definition](imperouter.d.ts).

## Do and Don't

Haven't ran benchmarks yet, but you should probably:

* Avoid local closures. Instead, define route handlers statically.
* Avoid large flat tables. Instead, structure your routes as trees.
* Use [`Req`](#class-req-extends-request) to avoid repeated URL parsing.

Do:

```js
function response(req) {
  // Avoids repeated URL parsing: `req.URL` is pre-parsed.
  req = new r.Req(req)

  return (
    // Grouped-up. If there's no match, the path is tested only once,
    // regardless of how many sub-routes it has.
    r.get(req, /^[/]posts(?:[/]|$)/, postRoutes) ||
    r.get(req, /(?:)/, notFound)
  )
}

function postRoutes(req) {
  return (
    r.get(req, /^[/]posts$/,               posts) ||
    r.get(req, /^[/]posts[/](?<id>[^/])$/, post)
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
    r.get(req, /^[/]posts$/,               req => {})         ||
    r.get(req, /^[/]posts[/](?<id>[^/])$/, (req, {id}) => {}) ||
    r.get(req, /(?:)/,                     req => {})
  )
}
```

## Changelog

### `0.8.3`

Minor bugfixes in `.d.ts` definition.

### `0.8.2`

Support string patterns for _exact_ pathname matching.

### `0.8.1`

Allow `imperouter.d.ts` in `.npmignore`.

### `0.8.0`

* Breaking: converted `Router` methods to functions, removed `Router`.
* Added TypeScript definitions.

### `0.7.0`

Breaking API revision: `Request`-based routing for SSR+SPA.

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

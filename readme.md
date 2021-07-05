## Overview

Minimal JS tools for:

  * String-and-regexp routing.
  * URL/query encoding.

Characteristics:

  * Imperative control.
  * Abstract, usable for server-side routing or with any UI library.
  * Lower-level than alternatives.
  * Uses plain strings, regexps, and named capture groups. No custom dialects.
  * Has various utils for URL encoding/decoding. The kind of stuff you wish the [`URL` standard](https://url.spec.whatwg.org) had.
  * Small and dependency-free (≈5 KiB _un_-minified).

Tiny, dependency-free, single file, native module.

## TOC

* [Overview](#overview)
* [Why](#why)
* [Usage](#usage)
* [API](#api)
  * [Types](#types)
  * [`find(str, routes)`](#findstr-routes--route-groups)
  * [`urlWithPathname(url, pathname)`](#urlwithpathnameurl-pathname--string)
  * [`urlWithSearch(url, search)`](#urlwithsearchurl-search--string)
  * [`urlWithHash(url, hash)`](#urlwithhashurl-hash--string)
  * [`urlWithQuery(url, query)`](#urlwithqueryurl-query--string)
  * [`urlAppendQuery(url, query)`](#urlappendqueryurl-query--string)
  * [`urlPatchQuery(url, query)`](#urlpatchqueryurl-query--string)
  * [`urlMutReplaceQuery(url, query)`](#urlmutreplacequeryurl-query--url)
  * [`urlMutAppendQuery(url, query)`](#urlmutappendqueryurl-query--url)
  * [`urlMutPatchQuery(url, query)`](#urlmutpatchqueryurl-query--url)
  * [`searchReplace(search, query)`](#searchreplacesearch-query--urlsearchparams)
  * [`searchAppend(search, query)`](#searchappendsearch-query--urlsearchparams)
  * [`searchPatch(search, query)`](#searchpatchsearch-query--urlsearchparams)
  * [`withUrl(url, fun, ...args)`](#withurlurl-fun-args--string)
  * [`urlQuery(url)`](#urlqueryurl--string-string--string)
  * [`searchQuery(search)`](#searchquerysearch--string-string--string)
* [Changelog](#changelog)
* [Misc](#misc)

## Why

Most routing libraries are overwrought.

Consider `react-router`:

* Ridiculous internal and API complexity.
* Insanely large; last I checked it was around 40 KiB minified.
* Custom string-based dialect for path matching.
* Hierarchical routing that makes top-level control impossible.
* Routing through rendering:
  * Makes it impossible to implement asynchronous top-level transitions, where the next page doesn't render until the data is ready.
  * Makes it impossible to pre-render the next page and slide it into view.
  * Hostile to isomorphic server-side rendering.
  * Redirects are a side effect of rendering, which again is hostile to isomorphic apps, which want to handle routing _before_ rendering, and return 301/302/303 for redirects.
* Missing support for URL queries; they don't even provide that as common-sense functions.
* Slow rendering.

Why regexps?

* Can tell _exactly_ what it will match.
* Don't have to learn fine semantics of yet another string-based dialect.
* Imperouter returns the matched route. There are no new concepts to understand.
* ES2018 has named capture groups, which obsolesces other ways of capturing named parameters, such as `'/path/:id'` in string-based dialects.

## Usage

Install with NPM, or import by URL:

```sh
npm i -E imperouter
```

```js
import * as ir from 'imperouter'
import * as ir from 'https://cdn.jsdelivr.net/npm/imperouter@0.6.0/jol.mjs'
```

Example:

```js
import * as ir from 'imperouter'

const routes = [
  {reg: /^[/]$/},
  {reg: /^[/]posts[/](?<slug>[^/]+)$/},
]

const path = '/posts/one-two-three'
const {route, groups} = ir.find(path, routes)

console.log(route)
// {reg: /^[/]posts[/](?<slug>[^/]+)$/}

console.log(groups)
// {slug: 'one-two-three'}
```

Imperouter returns the first matching route and named captures from its regexp. Interpreting the route is _up to you_.

One useful pattern is to put a handler function into every route:

```js
const routes = [
  {reg: /^[/]$/,                       fun: Index},
  {reg: /^[/]posts[/](?<slug>[^/]+)$/, fun: Post},
]

const path = '/posts/one-two-three'
const {route, groups} = ir.find(path, routes)
route.fun(groups)

function Index() {}
function Post({slug}) {console.log(slug)}
```

You're free to include side effects in your route handlers, such as UI updates. You can trivially implement asynchronous transitions. This doesn't need any special library support.

## API

All examples imply an import:

```js
import * as ir from 'imperouter'
```

### Types

Imperouter uses standard `URL` objects. Spec: https://url.spec.whatwg.org

In addition, it uses the convention that routes are plain objects whose `reg` is a regexp. They may contain arbitrary other properties.

### `find(str, routes)` → `{route, groups}`

Takes a string and a list of routes. Finds the first route whose `reg` regexp matches the string.

Returns `{route, groups}`, where `route` is the found route, and `groups` are matched named captures (ES2018 feature).

```js
const routes = [
  {reg: /^[/]posts[/](?<slug>[^/]+)$/},
]

const path = '/posts/one-two-three'
const {route, groups} = ir.find(path, routes)

console.log(groups)
// {slug: 'one-two-three'}
```

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

## Changelog

### `0.6.0`

Breaking API revision: removed `match`, revised `find`.

`find` no longer deals with `URL` objects. It takes a plain string, runs routes against it, and returns `{route, groups}`.

Route regex must be `route.reg`, rather than `route.path`. Imperouter attaches no special meaning to the string passed to it.

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

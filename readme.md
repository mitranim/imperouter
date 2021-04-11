## Overview

Minimal JS tools for:

  * URL/pathname routing.
  * URL/query encoding.

Characteristics:

  * Imperative control.
  * Abstract, usable for server routing or with any UI library.
  * Lower-level than alternatives.
  * Uses the [`URL` standard](https://url.spec.whatwg.org), regexps, and named capture groups. No custom dialects.
  * Small and dependency-free (≈5 KiB _un_-minified).

Provided as a native module (`.mjs`).

## TOC

* [Overview](#overview)
* [Why](#why)
* [Usage](#usage)
* [API](#api)
  * [Types](#types)
  * [`find(url, routes)`](#findurl-routes--route)
  * [`match(url, route)`](#matchurl-route--bool)
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
* ES2018 has named capture groups, which obsoletes other ways of capturing named parameters, such as `'/path/:id'` in string-based dialects.

## Usage

```sh
npm i -E imperouter
```

```js
import * as ir from 'imperouter'

const routes = [
  {path: /^[/]$/},
  {path: /^[/]posts[/](?<slug>[^/]+)$/},
]

const url = new URL('https://example.com/posts/one-two-three')
const route = ir.find(url, routes)

console.log(route)
// {path: /^[/]posts[/](?<slug>[^/]+)$/}

console.log(url.searchParams.get('slug'))
// 'one-two-three'
```

Imperouter finds the matching route and sets captured params into the `.searchParams` of the provided `URL`. There are no other side effects. Interpreting the route is _up to you_.

One useful pattern is to put a handler function into every route:

```js
const routes = [
  {path: /^[/]$/,                       fun: Index},
  {path: /^[/]posts[/](?<slug>[^/]+)$/, fun: Post},
]

const url = new URL('https://example.com/posts/one-two-three')
const route = ir.find(url, routes)
route.fun(url)

function Index(url) {console.log(url)}
function Post(url) {console.log(url, url.searchParams.get('slug'))}
```

You're free to include side effects in your route handlers, such as UI updates. You can trivially implement asynchronous transitions. This doesn't need any special library support.

## API

All examples imply an import:

```js
import * as ir from 'imperouter'
```

### Types

Imperouter uses standard `URL` objects. Spec: https://url.spec.whatwg.org

In addition, it uses the convention that routes are plain objects whose `path` is a regexp. They may contain arbitrary other properties.

### `find(url, routes)` → `route`

Takes a `URL` object and a list of routes. Returns the first route whose `path` regexp matches the _pathname_ of the provided URL. All other URL properties are ignored.

Matched _named_ captures are included into `url.searchParams`, mutating the provided URL. Named capture groups are an ES2018 feature.

```js
const routes = [
  {path: /^[/]posts[/](?<slug>[^/]+)$/},
]

const url = new URL('https://example.com/posts/one-two-three?four=five#six')
const route = ir.find(url, routes)

console.log(url.searchParams.get('slug'))
// 'one-two-three'
```

### `match(url, route)` → `bool`

Returns true if the route matches the URL's `pathname`. If the route was matched, the URL's `searchParams` may be mutated, adding the substrings matched by named capture groups.

```js
const route = {path: /^[/]posts[/](?<slug>[^/]+)$/}

const url = new URL('https://example.com')
console.log(ir.match(url, route), url.searchParams.get('slug'))
// false, null

url.href = 'https://example.com/posts/one-two-three'
console.log(ir.match(url, route), url.searchParams.get('slug'))
// true, 'one-two-three'
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

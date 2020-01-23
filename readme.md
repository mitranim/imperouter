## Overview

Minimal pushstate routing for JS applications.

  * replaces `react-router` and similar alternatives
  * works with any UI library
  * gives you imperative control
  * works well with server-side rendering
  * plain regexps, not a custom string-based dialect

Meant to be used with [`history`](https://github.com/ReactTraining/history) or an API-compatible alternative. Usable with any UI library. Comes with React and Preact adapters that implement pushstate links.

Size: ≈3.6 KiB minified, including the `querystring` dependency and one of the optional adapters.

Browser compatibility: should work in IE9+.

## TOC

* [Overview](#overview)
* [Why](#why)
* [Installation](#installation)
* [Usage](#usage)
* [API](#api)
  * [Location](#location)
  * [`findRouteMatch`](#findroutematchroutes-pathname---match)
  * [`matchRoute`](#matchrouteroute-pathname---match)
  * [`decodeLocation`](#decodelocationurl---location)
  * [`encodeLocation`](#encodelocationlocation---url)
  * [`decodeQuery`](#decodequerysearch---query)
  * [`encodeQuery`](#encodequeryquery---search)
  * [`withQuery`](#withquerylocation---location)
  * [`withSearch`](#withsearchlocation---location)
  * [`Context`](#context)
  * [`Link`](#link)
* [Misc](#misc)

## Why

Most routing libraries are overwrought.

Consider `react-router`:

* ridiculous internal and API complexity
* insanely large; last I checked it was around 40 KiB minified
* custom string-based dialect for path matching
* hierarchical routing that makes top-level control impossible
* routing through rendering:
  * makes it impossible to implement asynchronous top-level transitions, where the next page doesn't render until the data is ready
  * makes it impossible to pre-render the next page and slide it into view
  * hostile to isomorphic server-side rendering
  * redirects are a side effect of rendering, which again is hostile to isomorphic apps, which want to handle routing _before_ rendering, and return 301/302/303 for redirects
* missing support for URL queries; they don't even provide that as common-sense functions
* inferior rendering performance

Why regexps?

* can tell _exactly_ what it will match
* don't have to learn fine semantics of yet another string-based dialect
* imperouter returns regexp match, no new concepts to understand
* ES2018 has named capture groups, which make obsolete other ways of capturing named parameters, such as `'/path/:id'` in string-based dialects or Imperouter's own `{params: ['id']}`

## Installation

```js
npm i -E imperouter
```

## Usage

* Write route config
* Wire up a `history` listener
* Wire up UI

First, a route config:

```js
const routes = [
  {path: /^[/]$},
  {path: /^[/]posts[/]([^/]+)$/, params: ['id']},
  {path: /./},
]
```

Imperouter just finds the matching route. It doesn't trigger rendering or any other side effects. Interpreting the route is _up to you_. Usually, routes refer to a view component. These examples use Preact.

```js
const routes = [
  {path: /^[/]$,                                 component: LandingPage},
  {path: /^[/]posts[/]([^/]+)$/, params: ['id'], component: PostPage},
  {path: /./,                                    component: Page404},
]
function LandingPage ({location})               {/* ... */}
function PostPage    ({location, params: {id}}) {/* ... */}
function Page404     ({location})               {/* ... */}
```

We'll also need [`history`](https://github.com/ReactTraining/history). It lets us subscribe to history _push_ events, not just _pop_ events. When Imperouter links push new locations, the application can react to that.

```js
import createBrowserHistory from 'history/es/createBrowserHistory'

const history = createBrowserHistory()

// Defined below
history.listen(onLocationChange)

onLocationChange(history.location)
```

On location changes, we probably want to render the UI. Subscribe to the history and imperatively render from from the top. Assuming you're using Imperouter with React or Preact, make sure to include a `Context` with the history; this is required for pushstate links.

```js
import * as React from 'preact'
import * as ir from 'imperouter'
import {Context} from 'imperouter/preact'

const rootNode = document.getElementById('root')

function onLocationChange(location) {
  // Routes are defined above
  const match = ir.findRouteMatch(routes, location.pathname)

  // Note: `component` in the route is an application-level convention, not
  // dictated by the router. However, `params` are provided by the router.
  const {route: {component: Component}, params} = match

  const element = (
    <Context history={history}>
      <div id='root'>
        <Component location={location} params={params} />
      </div>
    </Context>
  )
  React.render(element, rootNode, rootNode.parent)
}
```

Note that you're free to include other side effects in the location handler. You can trivially implement asynchronous transitions by asking components to fetch data before rendering them. This doesn't need any special library support.

Finally, for pushstate navigation, use the `Link` component:

```js
import {Link} from 'imperouter/preact'

function LandingPage() {
  return (
    <div>
      <Link to='/'>Home</Link>
      <Link to='/posts/100'>First Post</Link>
    </div>
  )
}
```

If you pass a [location](#location), the link will detect if it's "current" and set the `[aria-current=true]` attribute. Use it for styling.

```js
import {Link} from 'imperouter/preact'

function LandingPage({location}) {
  return (
    <div>
      <Link to='/' exact location={location}>Home</Link>
      <Link to='/posts/100' location={location}>First Post</Link>
    </div>
  )
}
```

## API

All examples in this section imply an import:

```js
import * as ir from 'imperouter'
// or
const ir = require('imperouter')
```

### Location

Rather than plain URLs, both History and Imperouter use "locations", which are plain dicts that look like `window.location`:

```js
interface Location {
  protocol: string
  host:     string
  pathname: string
  search:   string
  query:    {[string]: string | [string]}
  hash:     string
}
```

The "query" is an Imperouter extension. When interfacing with History and `window.location`, use these functions for query support:

* [`decodeQuery`](#decodequerysearch---query)
* [`encodeQuery`](#encodequeryquery---search)
* [`withQuery`](#withquerylocation---location)
* [`withSearch`](#withsearchlocation---location)

### `findRouteMatch(routes, pathname) -> match`

Finds the first match via `matchRoute`. Returns `undefined` if nothing matches.

```js
const routes = [
  {path: /^[/]$/},
  {path: /^[/]posts$/},
  {path: /^[/]posts[/]([^/]+)$/, params: ['id']},
  {path: /./},
]

ir.findRouteMatch(routes, '/')
// ['/', route: {path: /^[/]$/}, params: {}]

ir.findRouteMatch(routes, '/posts/100')
/*
[
  '/posts/100',
  '100',
  route: {path: /^[/]posts/([^/]+)$/, params: ['id']},
  params: {id: '100'}
]
*/
```

### `matchRoute(route, pathname) -> match`

Tests the route. The route must look like this:

```js
const route = {path: /someRegexp/, params: ['someParamName']}

interface Route {
  path:   RegExp
  params: ?[]string
}
```

* `path` is mandatory and must be a regexp
* `params` are optional; if provided, must be a list of strings
* other properties are ignored

Returns the result of calling `route.path.exec(pathname)`, additionally assigning the original `route` and named `params`. See the match structure in the [`RegExp.prototype.exec`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec) docs.

Pass `params` to give names to the positional capture groups in your regexp:

```js
const route = {path: /^[/]posts[/]([^/]+)$/, params: ['id']}
//                                ↑ capture group      ↑ group name

const match = ir.matchRoute(route, '/posts/100')

// ['/posts/100', '100', route: {...}, params: {id: '100'}]
```

If your environment supports ES2018 named capture groups, you can use them instead of `params: [...]`:

```js
const route = {path: /^[/]posts[/](?<id>[^/]+)$/}
//                                ↑ named capture group

const match = ir.matchRoute(route, '/posts/100')

// ['/posts/100', '100', route: {...}, params: {id: '100'}]
```

### `decodeLocation(url) -> location`

Parses a URL string into a [location](#location) (see above) with a decoded query.

```js
const location = ir.decodeLocation('/one?two=three#four')
/*
{
  pathname: '/one',
  search: '?two=three',
  query: {two: 'three'},
  hash: '#four',
}
*/
```

### `encodeLocation(location) -> url`

Reverse of `decodeLocation`. Converts a [location](#location) into a URL. Automatically encodes `location.query`, which takes priority over `location.search`.

```js
const url0 = ir.encodeLocation({
  pathname: '/one',
  search: '?two=three',
  hash: '#four',
})
// '/one?two=three#four'

const url1 = ir.encodeLocation({
  pathname: '/one',
  query: {two: 'three'},
  hash: '#four',
})
// '/one?two=three#four'
```

### `decodeQuery(search) -> query`

Converts a search string into a query dict. Same as `querystring.decode`, but also accepts `null` and `undefined` and ignores the starting `?`, if any.

```js
ir.decodeQuery()
// {}

ir.decodeQuery('?one=two&three=four')
// {one: 'two', three: 'four'}

// ir.decodeQuery('one=two&one=three')
// {one: ['two', 'three']}
```

### `encodeQuery(query) -> search`

Converts a query dict into a search string. Same as `querystring.encode`, but also accepts a `null` or `undefined` query, treating it as `{}`, and omits `null` or `undefined` properties. Does not prepend `?` (breaking change in `0.3.0`).

```js
ir.encodeQuery()
// ''

ir.encodeQuery({one: 'two', three: 'four'})
// 'one=two&three=four'

ir.encodeQuery({one: ['two', 'three']})
// 'one=two&one=three'

ir.encodeQuery({one: 'two', three: null, four: undefined})
// 'one=two'
```

### `withQuery(location) -> location`

Returns a version of `location` where `location.query` is updated to match `location.search`.

```js
ir.withQuery({pathname: '/one', search: '?two=three'})
// {pathname: '/one', search: '?two=three', query: {two: 'three'}}
```

### `withSearch(location) -> location`

Returns a version of `location` where `location.search` is updated to match `location.query`. Use this before passing the `location` to History methods which support structured locations, but not queries.

```js
ir.withSearch({pathname: '/one', query: {two: 'three'}})
// {pathname: '/one', search: '?two=three', query: {two: 'three'}}
```

### `Context`

Part of the React and Preact adapters. Passes `history` to descendant links. Use this somewhere at the root of your view hierarchy.

See the [usage](#usage) examples above. In short:

```js
import createBrowserHistory from 'history/es/createBrowserHistory'
import {Context} from 'imperouter/preact'

const history = createBrowserHistory()

<Context history={history}> ... site content ... </Context>
```

### `Link`

Part of the React and Preact adapters. Pushstate-enabled HTML link. Requires a `Context` with a `history`. See the [usage](#usage) examples above.

Accepted props:

```js
import {Link} from 'imperouter/preact'

<Link
  // Location as string
  to='/one?two=three#four'

  // Structured location
  to={{pathname: '/one', query: {two: 'three'}, hash: '#four', state: {}}}

  // Optional: use `history.replace` rather than `history.push`
  replace

  // Optional, used to detect "current" state.
  // "Current" links have an `aria-current='true'` attribute.
  location={history.location}

  // Optional; if true, the "current" detection will match the pathname
  // exactly. By default, it also matches subpaths. Use this for '/'.
  exact

  />
```

## Changelog

### `0.3.0`

Minor but potentially breaking changes:

* `<Link>` with `target='_blank'` acts like a standard `<a>`, does not trigger pushstate navigation
* `encodeQuery` no longer prepends `?`
* `params` now inherit from `null` rather than `Object.prototype`

Added feature:

* support ES2018 regexp named capture groups

### `0.2.0`

Added React adapter.

## Misc

I'm receptive to suggestions. If this library _almost_ satisfies you but needs changes, open an issue or chat me up. Contacts: https://mitranim.com/#contacts

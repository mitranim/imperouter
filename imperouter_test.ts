// deno-lint-ignore-file no-explicit-any

import 'https://cdn.jsdelivr.net/npm/@mitranim/test@0.1.2/emptty.mjs'
import * as t from 'https://cdn.jsdelivr.net/npm/@mitranim/test@0.1.2/test.mjs'
import * as r from './imperouter.mjs'

const TEST_URL = `https://one.two/three?four=five#six`

t.test(function test_Req() {
  t.test(function test_reject_invalid_inputs() {
    t.throws(() => new r.Req(undefined      as any), TypeError, `Invalid URL`)
    t.throws(() => new r.Req(`blah`         as any), TypeError, `Invalid URL`)
    t.throws(() => new r.Req({}             as any), TypeError, `Invalid URL`)
    t.throws(() => new r.Req(new Response() as any), TypeError, `Invalid URL`)
    t.throws(() => new r.Req([]             as any), TypeError, `Invalid URL`)
  })

  t.test(function test_req_structure() {
    t.ok(new r.Req(TEST_URL)     instanceof Request)
    t.ok(new r.Req(TEST_URL).URL instanceof URL)

    t.is(new r.Req(TEST_URL).URL.toString(),           TEST_URL)
    t.is(new r.Req(TEST_URL).url,                      TEST_URL)
    t.is(new r.Req(TEST_URL).method,                   r.GET)
    t.is(new r.Req(TEST_URL, {method: r.POST}).method, r.POST)
  })
})

t.test(function test_test() {
  const req = new Request(TEST_URL, {method: r.POST})

  t.test(function test_reject_invalid_inputs() {
    t.throws(() => r.test(req, undefined as any, undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.test(req, {}        as any, undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.test(req, r.GET,            undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.test(req, r.GET,            {}        as any), TypeError, `satisfy test`)
  })

  t.test(function test_method_nomatch_nil() {
    t.is(r.test(req, r.GET,  `/three`),     undefined)
    t.is(r.test(req, r.HEAD, `/three`),     undefined)

    t.is(r.test(req, r.GET,  /three/),      undefined)
    t.is(r.test(req, r.HEAD, /three/),      undefined)

    t.is(r.test(req, r.GET,  /^[/]three$/), undefined)
    t.is(r.test(req, r.HEAD, /^[/]three$/), undefined)
  })

  t.test(function test_method_str_match_bool() {
    t.is(r.test(req, r.POST, `/three`),  true)

    t.is(r.test(req, r.POST, `three`),   false)
    t.is(r.test(req, r.POST, `/three/`), false)
    t.is(r.test(req, r.POST, `three/`),  false)
    t.is(r.test(req, r.POST, `four`),    false)
    t.is(r.test(req, r.POST, `/four`),   false)
  })

  t.test(function test_method_reg_match_bool() {
    t.is(r.test(req, r.POST, /(?:)/),       true)
    t.is(r.test(req, r.POST, /three/),      true)
    t.is(r.test(req, r.POST, /^[/]three$/), true)

    t.is(r.test(req, r.POST, /four/),       false)
  })
})

t.test(function test_match() {
  const req = new Request(TEST_URL, {method: r.POST})

  t.test(function test_reject_invalid_inputs() {
    t.throws(() => r.match(req, undefined as any, undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.match(req, {}        as any, undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.match(req, r.GET,            undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.match(req, r.GET,            {}        as any), TypeError, `satisfy test`)
  })

  t.test(function test_method_nomatch_nil() {
    t.is(r.match(req, r.GET,  `/three`),     undefined)
    t.is(r.match(req, r.HEAD, `/three`),     undefined)

    t.is(r.match(req, r.GET,  /three/),      undefined)
    t.is(r.match(req, r.HEAD, /three/),      undefined)

    t.is(r.match(req, r.GET,  /^[/]three$/), undefined)
    t.is(r.match(req, r.HEAD, /^[/]three$/), undefined)
  })

  t.test(function test_method_match_str_match() {
    t.eq(r.match(req, r.POST, `/three`),         [`/three`])
    t.eq(r.match(req, r.POST, `/three`)!.groups, undefined)

    t.is(r.match(req, r.POST, `three`),   null)
    t.is(r.match(req, r.POST, `/three/`), null)
    t.is(r.match(req, r.POST, `three/`),  null)
  })

  t.test(function test_method_match_reg_match() {
    t.eq([...r.match(req, r.POST, /^[/](?<val>three)$/)!],       [`/three`, `three`])
    t.eq(    r.match(req, r.POST, /^[/](?<val>three)$/)!.groups, {val: `three`})

    t.is(r.match(req, r.POST, /three[/]/), null)
    t.is(r.match(req, r.POST, /four/),     null)
  })
})

t.test(function test_only() {
  const req = new Request(TEST_URL, {method: r.POST})

  t.test(function test_reject_invalid_inputs() {
    t.throws(() => r.only(req, {}     as any, undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.only(req, `blah` as any, {}        as any), TypeError, `satisfy test`)
  })

  t.test(function test_nomatch_not_allowed() {
    eqRes(r.only(req),         {status: 405})
    eqRes(r.only(req, r.HEAD), {status: 405})
  })

  t.test(function test_match_nil() {
    t.is(r.only(req, r.POST),        undefined)
    t.is(r.only(req, r.POST, r.GET), undefined)
    t.is(r.only(req, r.GET, r.POST), undefined)
  })
})

t.test(function test_method() {
  const req = new Request(TEST_URL, {method: r.POST})

  t.test(function test_reject_invalid_inputs() {
    t.throws(() => r.method(req, {}     as any, undefined as any, undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.method(req, nop    as any, undefined as any, undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.method(req, r.POST,        undefined as any, undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.method(req, r.POST,        /(?:)/,           undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.method(req, {}     as any, /(?:)/,           undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.method(req, {}     as any, /(?:)/,           nop       as any), TypeError, `satisfy test`)
  })

  t.test(function test_match_method_and_pathname_str() {
    t.is(r.method(req, r.GET,  `/three`, panic), undefined)
    t.is(r.method(req, r.POST, `/four`,  panic), undefined)

    t.eq(r.method(req, r.POST, `/three`, getargs), [req, undefined])
  })

  t.test(function test_match_method_and_pathname_reg() {
    t.is(r.method(req, r.GET,  /(?:)/,                  panic), undefined)
    t.is(r.method(req, r.POST, /one|two|four|five|six/, panic), undefined)

    t.eq(r.method(req, r.POST, /^[/]three$/,          getargs), [req, undefined])
    t.eq(r.method(req, r.POST, /^[/](?<path>three)$/, getargs), [req, {path: `three`}])
  })
})

// TODO test async fallback.
t.test(function test_sub() {
  const req = new Request(TEST_URL, {method: r.POST})

  t.test(function test_reject_invalid_inputs() {
    t.throws(() => r.sub(req, undefined as any, undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.sub(req, {}        as any, undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.sub(req, nop       as any, undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.sub(req, /(?:)/,           undefined as any), TypeError, `satisfy test`)
    t.throws(() => r.sub(req, /(?:)/,           {}        as any), TypeError, `satisfy test`)
  })

  t.test(function test_nomatch_nil() {
    t.is(r.sub(req, /four/, panic), undefined)
  })

  t.test(function test_match_pass_self() {
    t.is(r.sub(req, /(?:)/, id),         req)
    t.is(r.sub(req, /three/, id),        req)
    t.eq(r.sub(req, /(?:)/, getargs), [req])
  })

  t.test(function test_match_return_any_truthy_result() {
    t.is(r.sub(req, /(?:)/, () => `blah`), `blah`)
    t.is(r.sub(req, /(?:)/, () => true),   true)
    t.is(r.sub(req, /(?:)/, () => 1),      1)
  })

  t.test(function test_match_fallback_not_found() {
    eqRes(r.sub(req, /(?:)/, nop), {status: 404})
  })
})

t.test(function test_preflight() {
  const req = new Request(TEST_URL, {method: r.POST})

  t.test(function test_reject_invalid_inputs() {
    t.throws(() => r.preflight(req, null   as any), TypeError, `satisfy test`)
    t.throws(() => r.preflight(req, `blah` as any), TypeError, `satisfy test`)
    t.throws(() => r.preflight(req, {}     as any), TypeError, `satisfy test`)
  })

  t.test(function test_default() {
    t.is(r.preflight(new r.Req(TEST_URL, {method: r.GET})), undefined)
    t.is(r.preflight(new r.Req(TEST_URL, {method: r.POST})), undefined)
    eqRes(r.preflight(new r.Req(TEST_URL, {method: r.HEAD})), {status: 200})
    eqRes(r.preflight(new r.Req(TEST_URL, {method: r.OPTIONS})), {status: 200})
  })

  t.test(function test_override() {
    function over(_?: Request) {return `override`}
    t.is(r.preflight(new r.Req(TEST_URL, {method: r.GET}), over), undefined)
    t.is(r.preflight(new r.Req(TEST_URL, {method: r.POST}), over), undefined)
    t.is(r.preflight(new r.Req(TEST_URL, {method: r.HEAD}), over), `override`)
    t.is(r.preflight(new r.Req(TEST_URL, {method: r.OPTIONS}), over), `override`)
  })
})

function eqRes(val: Record<string, any> | void, pattern: Record<string, any>) {
  t.ok(val instanceof Response)
  for (const key in pattern) t.eq((val as any)[key], pattern[key])
}

function panic() {throw Error(`panic`)}
function getargs(...args: any[]) {return args}
function id<T>(val: T) {return val}
function nop(..._: unknown[]) {}

console.log(`[test] ok!`)

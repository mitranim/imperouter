// Needs more tests for the URL utils.

// deno-lint-ignore-file no-explicit-any

import {
  assert as ok,
  assertStrictEquals as eq,
  assertEquals as equiv,
  assertThrows as throws,
} from 'https://deno.land/std@0.100.0/testing/asserts.ts'

import * as r from './imperouter.mjs'

const TEST_URL = `https://one.two/three?four=five#six`

void function test_Req() {
  void function test_reject_invalid_inputs() {
    throws(() => new r.Req(undefined      as any), TypeError)
    throws(() => new r.Req('blah'         as any), TypeError, `Invalid URL`)
    throws(() => new r.Req({}             as any), TypeError, `Invalid URL`)
    throws(() => new r.Req(new Response() as any), TypeError, `Invalid URL`)
    throws(() => new r.Req([]             as any), TypeError, `Invalid URL`)
  }()

  void function test_req_structure() {
    ok(new r.Req(TEST_URL)     instanceof Request)
    ok(new r.Req(TEST_URL).URL instanceof URL)

    eq(new r.Req(TEST_URL).URL.toString(),           TEST_URL)
    eq(new r.Req(TEST_URL).url,                      TEST_URL)
    eq(new r.Req(TEST_URL).method,                   r.GET)
    eq(new r.Req(TEST_URL, {method: r.POST}).method, r.POST)
  }()
}()

void function test_test() {
  const req = new r.Req(TEST_URL, {method: r.POST})

  void function test_reject_invalid_inputs() {
    throws(() => r.test(req, undefined as any, undefined as any), TypeError, `satisfy test`)
    throws(() => r.test(req, {}        as any, undefined as any), TypeError, `satisfy test`)
    throws(() => r.test(req, r.GET,            undefined as any), TypeError, `satisfy test`)
    throws(() => r.test(req, r.GET,            {}        as any), TypeError, `satisfy test`)
  }()

  void function test_method_nomatch_nil() {
    eq(r.test(req, r.GET,  /three/), undefined)
    eq(r.test(req, r.HEAD, /three/), undefined)
  }()

  void function test_method_match_bool() {
    eq(r.test(req, r.POST, /(?:)/),  true)
    eq(r.test(req, r.POST, /three/), true)
    eq(r.test(req, r.POST, /four/),  false)
  }()
}()

void function test_match() {
  const req = new r.Req(TEST_URL, {method: r.POST})

  void function test_reject_invalid_inputs() {
    throws(() => r.match(req, undefined as any, undefined as any), TypeError, `satisfy test`)
    throws(() => r.match(req, {}        as any, undefined as any), TypeError, `satisfy test`)
    throws(() => r.match(req, r.GET,            undefined as any), TypeError, `satisfy test`)
    throws(() => r.match(req, r.GET,            {}        as any), TypeError, `satisfy test`)
  }()

  void function test_method_nomatch_nil() {
    eq(r.match(req, r.GET,  /three/), undefined)
    eq(r.match(req, r.HEAD, /three/), undefined)
  }()

  void function test_method_match_match() {
    eq(       r.match(req, r.POST, /four/),                       null)
    equiv([...r.match(req, r.POST, /^[/](?<val>three)$/)!],       ['/three', 'three'])
    equiv(    r.match(req, r.POST, /^[/](?<val>three)$/)!.groups, {val: 'three'})
  }()
}()

void function test_only() {
  const req = new r.Req(TEST_URL, {method: r.POST})

  void function test_reject_invalid_inputs() {
    throws(() => r.only(req, {}     as any, undefined as any), TypeError, `satisfy test`)
    throws(() => r.only(req, 'blah' as any, {}        as any), TypeError, `satisfy test`)
  }()

  void function test_nomatch_not_allowed() {
    eqRes(r.only(req),         {status: 405})
    eqRes(r.only(req, r.HEAD), {status: 405})
  }()

  void function test_match_nil() {
    eq(r.only(req, r.POST),        undefined)
    eq(r.only(req, r.POST, r.GET), undefined)
    eq(r.only(req, r.GET, r.POST), undefined)
  }()
}()

void function test_method() {
  const req = new r.Req(TEST_URL, {method: r.POST})

  void function test_reject_invalid_inputs() {
    throws(() => r.method(req, {}     as any, undefined as any, undefined as any), TypeError, `satisfy test`)
    throws(() => r.method(req, nop    as any, undefined as any, undefined as any), TypeError, `satisfy test`)
    throws(() => r.method(req, r.POST,        undefined as any, undefined as any), TypeError, `satisfy test`)
    throws(() => r.method(req, r.POST,        /(?:)/,           undefined as any), TypeError, `satisfy test`)
    throws(() => r.method(req, {}     as any, /(?:)/,           undefined as any), TypeError, `satisfy test`)
    throws(() => r.method(req, {}     as any, /(?:)/,           nop       as any), TypeError, `satisfy test`)
  }()

  void function test_match_method_and_pathname() {
    eq(r.method(req, r.GET,  /(?:)/,                  panic), undefined)
    eq(r.method(req, r.POST, /one|two|four|five|six/, panic), undefined)

    equiv(r.method(req, r.POST, /^[/]three$/,          getargs), [req, undefined])
    equiv(r.method(req, r.POST, /^[/]three$/,          getargs), [req, undefined])
    equiv(r.method(req, r.POST, /^[/](?<path>three)$/, getargs), [req, {path: 'three'}])
  }()
}()

// TODO test async fallback.
void function test_sub() {
  const req = new r.Req(TEST_URL, {method: r.POST})

  void function test_reject_invalid_inputs() {
    throws(() => r.sub(req, undefined as any, undefined as any), TypeError, `satisfy test`)
    throws(() => r.sub(req, {}        as any, undefined as any), TypeError, `satisfy test`)
    throws(() => r.sub(req, nop       as any, undefined as any), TypeError, `satisfy test`)
    throws(() => r.sub(req, /(?:)/,           undefined as any), TypeError, `satisfy test`)
    throws(() => r.sub(req, /(?:)/,           {}        as any), TypeError, `satisfy test`)
  }()

  void function test_nomatch_nil() {
    eq(r.sub(req, /four/, panic), undefined)
  }()

  void function test_match_pass_self() {
    eq(r.sub(req, /(?:)/, id),         req)
    eq(r.sub(req, /three/, id),        req)
    equiv(r.sub(req, /(?:)/, getargs), [req])
  }()

  void function test_match_return_any_truthy_result() {
    eq(r.sub(req, /(?:)/, () => 'blah'), 'blah')
    eq(r.sub(req, /(?:)/, () => true),   true)
    eq(r.sub(req, /(?:)/, () => 1),      1)
  }()

  void function test_match_fallback_not_found() {
    eqRes(r.sub(req, /(?:)/, nop), {status: 404})
  }()
}()

void function test_preflight() {
  const req = new r.Req(TEST_URL, {method: r.POST})

  void function test_reject_invalid_inputs() {
    throws(() => r.preflight(req, null   as any), TypeError, `satisfy test`)
    throws(() => r.preflight(req, 'blah' as any), TypeError, `satisfy test`)
    throws(() => r.preflight(req, {}     as any), TypeError, `satisfy test`)
  }()

  void function test_default() {
    eq(r.preflight(new r.Req(TEST_URL, {method: r.GET})), undefined)
    eq(r.preflight(new r.Req(TEST_URL, {method: r.POST})), undefined)
    eqRes(r.preflight(new r.Req(TEST_URL, {method: r.HEAD})), {status: 200})
    eqRes(r.preflight(new r.Req(TEST_URL, {method: r.OPTIONS})), {status: 200})
  }()

  void function test_override() {
    function over(_?: Request) {return 'override'}
    eq(r.preflight(new r.Req(TEST_URL, {method: r.GET}), over), undefined)
    eq(r.preflight(new r.Req(TEST_URL, {method: r.POST}), over), undefined)
    eq(r.preflight(new r.Req(TEST_URL, {method: r.HEAD}), over), 'override')
    eq(r.preflight(new r.Req(TEST_URL, {method: r.OPTIONS}), over), 'override')
  }()
}()

// TODO: tests for other URL functions.
void function test_searchReplace() {
  void function test_clearing() {
    const search = new URLSearchParams('one=two&three=four&five=six&seven=eight')
    r.searchReplace(search, undefined)
    eq(search.toString(), ``)
  }()

  void function test_replacing() {
    const search = new URLSearchParams('one=two&three=four&five=six&seven=eight')
    const query = {three: null, seven: 'nine'}

    r.searchReplace(search, query)
    eq(search.toString(), `seven=nine`)
  }()
}()

function eqRes(val: Record<string, any> | void, pattern: Record<string, any>) {
  ok(val instanceof Response)
  for (const key in pattern) equiv((val as any)[key], pattern[key])
}

function panic() {throw Error(`panic`)}
function getargs(...args: any[]) {return args}
function id<T>(val: T) {return val}
function nop(..._: unknown[]) {}

console.log(`[test] ok`)

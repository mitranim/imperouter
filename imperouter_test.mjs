// Needs more tests for the URL utils.

import {
  assert as ok,
  assertStrictEquals as eq,
  assertEquals as equiv,
  assertThrows as throws,
} from 'https://deno.land/std@0.100.0/testing/asserts.ts'

import * as ir from './imperouter.mjs'

const URL = `https://one.two/three?four=five#six`

void function test_Router() {
  const req = new ir.Router(URL, {method: ir.POST})

  void function test_reject_invalid_inputs() {
    throws(() => new ir.Router(),               TypeError)
    throws(() => new ir.Router('blah'),         TypeError, `Invalid URL`)
    throws(() => new ir.Router({}),             TypeError, `Invalid URL`)
    throws(() => new ir.Router(new Response()), TypeError, `Invalid URL`)
    throws(() => new ir.Router([]),             TypeError, `Invalid URL`)
  }()

  void function test_test() {
    void function test_reject_invalid_inputs() {
      throws(() => req.test(),           TypeError, `satisfy test`)
      throws(() => req.test({}),         TypeError, `satisfy test`)
      throws(() => req.test(ir.GET),     TypeError, `satisfy test`)
      throws(() => req.test(ir.GET, {}), TypeError, `satisfy test`)
    }()

    void function test_method_nomatch_nil() {
      eq(req.test(ir.GET,  /three/), undefined)
      eq(req.test(ir.HEAD, /three/), undefined)
    }()

    void function test_method_match_bool() {
      eq(req.test(ir.POST, /(?:)/),  true)
      eq(req.test(ir.POST, /three/), true)
      eq(req.test(ir.POST, /four/),  false)
    }()
  }()

  void function test_match() {
    void function test_reject_invalid_inputs() {
      throws(() => req.match(),           TypeError, `satisfy test`)
      throws(() => req.match({}),         TypeError, `satisfy test`)
      throws(() => req.match(ir.GET),     TypeError, `satisfy test`)
      throws(() => req.match(ir.GET, {}), TypeError, `satisfy test`)
    }()

    void function test_method_nomatch_nil() {
      eq(req.match(ir.GET,  /three/), undefined)
      eq(req.match(ir.HEAD, /three/), undefined)
    }()

    void function test_method_match_match() {
      eq(       req.match(ir.POST, /four/),                      null)
      equiv([...req.match(ir.POST, /^[/](?<val>three)$/)],       ['/three', 'three'])
      equiv(    req.match(ir.POST, /^[/](?<val>three)$/).groups, {val: 'three'})
    }()
  }()

  void function test_only() {
    void function test_reject_invalid_inputs() {
      throws(() => req.only({}),         TypeError, `satisfy test`)
      throws(() => req.only('blah', {}), TypeError, `satisfy test`)
    }()

    void function test_nomatch_not_allowed() {
      eqRes(req.only(),        {status: 405})
      eqRes(req.only(ir.HEAD), {status: 405})
    }()

    void function test_match_nil() {
      eq(req.only(ir.POST),         undefined)
      eq(req.only(ir.POST, ir.GET), undefined)
      eq(req.only(ir.GET, ir.POST), undefined)
    }()
  }()

  void function test_meth() {
    void function test_reject_invalid_inputs() {
      throws(() => req.meth({}),                   TypeError, `satisfy test`)
      throws(() => req.meth(nop),                  TypeError, `satisfy test`)
      throws(() => req.meth(ir.POST),              TypeError, `satisfy test`)
      throws(() => req.meth(ir.POST, /(?:)/),      TypeError, `satisfy test`)
      throws(() => req.meth({},      /(?:)/),      TypeError, `satisfy test`)
      throws(() => req.meth({},      /(?:)/, nop), TypeError, `satisfy test`)
    }()

    void function test_match_method_and_pathname() {
      eq(req.meth(ir.GET,  /(?:)/,                  panic), undefined)
      eq(req.meth(ir.POST, /one|two|four|five|six/, panic), undefined)

      equiv(req.meth(ir.POST, /^[/]three$/,          getargs), [req, undefined])
      equiv(req.meth(ir.POST, /^[/]three$/,          getargs), [req, undefined])
      equiv(req.meth(ir.POST, /^[/](?<path>three)$/, getargs), [req, {path: 'three'}])
    }()
  }()

  // TODO test async fallback.
  void function test_sub() {
    void function test_reject_invalid_inputs() {
      throws(() => req.sub(),           TypeError, `satisfy test`)
      throws(() => req.sub({}),         TypeError, `satisfy test`)
      throws(() => req.sub(nop),        TypeError, `satisfy test`)
      throws(() => req.sub(/(?:)/),     TypeError, `satisfy test`)
      throws(() => req.sub(/(?:)/, {}), TypeError, `satisfy test`)
    }()

    void function test_nomatch_nil() {
      eq(req.sub(/four/, panic), undefined)
    }()

    void function test_match_pass_self() {
      eq(req.sub(/(?:)/, id),         req)
      eq(req.sub(/three/, id),        req)
      equiv(req.sub(/(?:)/, getargs), [req])
    }()

    void function test_match_return_any_truthy_result() {
      eq(req.sub(/(?:)/, () => 'blah'), 'blah')
      eq(req.sub(/(?:)/, () => true),   true)
      eq(req.sub(/(?:)/, () => 1),      1)
    }()

    void function test_match_fallback_not_found() {
      eqRes(req.sub(/(?:)/, nop), {status: 404})
    }()
  }()

  void function test_preflight() {
    void function test_reject_invalid_inputs() {
      throws(() => req.preflight(null), TypeError, `satisfy test`)
      throws(() => req.preflight('blah'), TypeError, `satisfy test`)
      throws(() => req.preflight({}), TypeError, `satisfy test`)
    }()

    void function test_default() {
      eq(new ir.Router(URL, {method: ir.GET}).preflight(), undefined)
      eq(new ir.Router(URL, {method: ir.POST}).preflight(), undefined)
      eqRes(new ir.Router(URL, {method: ir.HEAD}).preflight(), {status: 200})
      eqRes(new ir.Router(URL, {method: ir.OPTIONS}).preflight(), {status: 200})
    }()

    void function test_override() {
      function over() {return 'override'}
      eq(new ir.Router(URL, {method: ir.GET}).preflight(over), undefined)
      eq(new ir.Router(URL, {method: ir.POST}).preflight(over), undefined)
      eq(new ir.Router(URL, {method: ir.HEAD}).preflight(over), 'override')
      eq(new ir.Router(URL, {method: ir.OPTIONS}).preflight(over), 'override')
    }()
  }()
}()

// TODO: tests for other URL functions.
void function test_searchReplace() {
  void function test_clearing() {
    const search = new URLSearchParams('one=two&three=four&five=six&seven=eight')
    ir.searchReplace(search)
    eq(search.toString(), ``)
  }()

  void function test_replacing() {
    const search = new URLSearchParams('one=two&three=four&five=six&seven=eight')
    const query = {three: null, seven: 'nine'}

    ir.searchReplace(search, query)
    eq(search.toString(), `seven=nine`)
  }()
}()

function eqRes(val, pattern) {
  ok(val instanceof Response)
  for (const key in pattern) equiv(val[key], pattern[key])
}

function panic() {throw Error(`panic`)}
function getargs(...args) {return args}
function id(val) {return val}
function nop() {}

console.log(`[test] ok`)

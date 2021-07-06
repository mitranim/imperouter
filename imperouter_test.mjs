// PLACEHOLDER. Needs more tests.

import {
  // assert as ok,
  assertStrictEquals as eq,
  // assertEquals as equiv,
  // assertThrows as throws,
} from 'https://deno.land/std@0.100.0/testing/asserts.ts'

import * as ir from './imperouter.mjs'

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

console.log(`[test] ok`)

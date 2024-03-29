MAKEFLAGS := --silent --always-make
PAR := $(MAKE) -j 128
TEST := imperouter_test.ts
DENO := deno run

watch:
	$(PAR) test-w lint-w

prep: lint test

test-w:
	$(DENO) --watch $(TEST)

test:
	$(DENO) $(TEST)

lint-w:
	watchexec -r -d=0 -e=mjs,ts -n -- make lint

lint:
	deno lint

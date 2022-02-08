MAKEFLAGS := --silent --always-make
PAR := $(MAKE) -j 128
TEST := imperouter_test.ts
DENO := deno run

test_w:
	$(DENO) --watch $(TEST)

test:
	$(DENO) $(TEST)

lint_w:
	watchexec -r -d=0 -e=mjs,ts -n -- make lint

lint:
	deno lint

watch:
	$(PAR) test_w lint_w

prep: test lint

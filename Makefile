

%.js: %.ts
	@tsc -t es6 $< --module commonjs

	@mv $@ es6_$@
	@babel es6_$@ -o $@
	@rm es6_$@

all: test.js cpu.js

clean:
	@rm -f *.js || true
	@rm -f *.es6 || true


test: all
	@node test.js

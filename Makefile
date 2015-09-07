
.PHONY: all clean test

%.js: %.ts
	@tsc -t es5 $< --module commonjs

	@# Change the following line to prevent node from blowing up.
	@# Not sure why babel does this...
	@# var __extends = undefined.__extends || function (d, b) {
	@# var __extends =  function (d, b) {
	@sed -ie 's#undefined.__extends || function#function#g' $@

	@#@mv $@ es6_$@
	@#@babel es6_$@ -o $@
	@#@rm es6_$@

all: assembler.js test.js cpu.js

clean:
	@rm -f *.js || true


test: all
	@node test.js

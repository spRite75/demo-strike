.PHONY: install build watch generate start-local start-local-debug

install:
	npm i

build:
	npm run build

watch:
	npm run watch

generate:
	npm run generate

start-local:
	firebase emulators:start --import .emulatordata --export-on-exit

start-local-debug:
	firebase emulators:start --import .emulatordata --export-on-exit --inspect-functions



.PHONY: install generate start-local

install:
	npm i

build:
	npm run build

generate:
	npm run generate

start-local:
	firebase emulators:start --import .emulatordata --export-on-exit

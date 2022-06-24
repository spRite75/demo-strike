.PHONY: install install-ci generate test build start start-debug
install:
	npm i

install-ci:
	npm ci

generate:
	npm run generate

test: generate
	npm test

build: generate
	npm run build

start: generate
	npm run start

start-debug: generate
	npm run start:debug

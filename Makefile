.PHONY: install build generate start
install:
	npm i

generate:
	npm run generate

build:
	npm run build

start:
	npm run start

start-debug:
	npm run start:debug

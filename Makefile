.PHONY: install graphql-codegen start-local

install:
	(cd functions && npm i) & (cd client && npm i)

graphql-codegen:
	(cd functions && npm run graphql-codegen) & (cd client && npm run graphql-codegen) 

start-local:
	firebase emulators:start --import .emulatordata --export-on-exit

.PHONY: graphql-codegen

install:
	(cd functions && npm i) & (cd client && npm i)

graphql-codegen:
	(cd functions && npm run graphql-codegen) & (cd client && npm run graphql-codegen) 

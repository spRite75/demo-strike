# demo-strike

A project to parse CSGO Demos and provide insights into history and stats.

## Local dev setup

Requires:

- Node 16
- Firebase CLI
- Java (8+)
- `make` in your PATH
- Docker (with `docker-compose`)

1. Install dependencies
   - `make install`
2. Copy the environemt template and populate it with some values
   - `cp packages/server/.env.example .env`
3. Make sure you have a postgres DB to connect to
   - `docker-compose up`
4. Run the stack
   - `make start`

Well done! Here are the ports/urls you will need:

- UI: http://localhost:3000
- API: http://localhost:3000/api
- GraphQL Explorer: http://localhost:3000/api/graphql

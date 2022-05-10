# demo-strike

A project to parse CSGO Demos and provide insights into history and stats.

## Local setup

Requires:
- Node 16
- Firebase CLI
- Java (8+)

1. Get the latest firebase cli
    - `npm install -g firebase-tools`
2. Install dependencies
    - `make install` or `npm i`
3. Compile + watch functions and client
    - `make watch` or `npm run watch`
4. In another terminal, run the local Firebase emulators
    - `make start-local` or `firebase emulators:start --import .emulatordata --export-on-exit`

Well done! Here are the ports/urls you will need:
- UI: http://localhost:5000
- GraphQL Server: http://localhost:5000/graphql
- Firebase emulators UI: http://localhost:4000

You'll need to restart the watch command you ran in step 3 if you change `packages/functions/src/graphql/schema.graphql`.

### Creating a user

1. Sign in via the main page at `http://localhost:5000` to create a local user account
2. Add the `needsProfile` flag to the user in the Firebase Auth Emulator ![Visual reference for adding `needsProfile` flag](/docs/local-user-setup.png)

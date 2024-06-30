# Hangman, the game

```txt
  +---+
  |   |
  O   |
 /|\  |
 / \  |
      |
```

## Description

A Hangman game which runs as a Farcaster-native rollup frame. Rollup powered by [Stackr SDK](https://www.npmjs.com/package/@stackr/sdk)

## How to run the game

- Clone the repo and install the dependencies

```sh
cd hangman
npm i
```

- Setup env variables for Micro-rollup

```sh
touch .env
# and add the following content into it.
PRIVATE_KEY= # private key of the account
# pick these values from https://docs.stf.xyz/build/references/providers-and-rpc for Sepolia
VULCAN_RPC=
L1_RPC=
REGISTRY_CONTRACT=
DATABASE_URI=./db.sqlite
```

- Register and Deploy your Micro-rollup

```sh
npx @stackr/cli@latest register
npx @stackr/cli@latest deploy
```

- Start the game

```sh
npm run dev
# open localhost:5173/dev
```

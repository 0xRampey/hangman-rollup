import { ActionSchema, SolidityType } from "@stackr/sdk";

// createAccountSchema is a schema for creating an account
export const createGameSchema = new ActionSchema("createGame", {
  word: SolidityType.STRING,
  numPlayers: SolidityType.UINT,
});

export const guessLetterSchema = new ActionSchema("guessLetter", {
  letter: SolidityType.STRING,
  gameID: SolidityType.UINT,
});

// transferSchema is a collection of all the transfer actions
// that can be performed on the rollup
export const schemas = {
  createGame: createGameSchema,
  guessLetter: guessLetterSchema,
};

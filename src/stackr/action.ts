import { ActionSchema, SolidityType } from "@stackr/sdk";

// createAccountSchema is a schema for creating an account
export const createGameSchema = new ActionSchema("createGame", {
  word: SolidityType.STRING,
  creator: SolidityType.STRING,
});

export const guessLetterSchema = new ActionSchema("guessLetter", {
  letter: SolidityType.STRING,
  nonce: SolidityType.UINT,
  player: SolidityType.STRING,
});

// transferSchema is a collection of all the transfer actions
// that can be performed on the rollup
export const schemas = {
  createGame: createGameSchema,
  guessLetter: guessLetterSchema,
};

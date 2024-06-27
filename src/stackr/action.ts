import { ActionSchema, SolidityType } from "@stackr/sdk";

// createAccountSchema is a schema for creating an account
export const createGameSchema = new ActionSchema("createGame", {
  word: SolidityType.STRING,
  creator: SolidityType.STRING,
  hint: SolidityType.STRING,
});

export const guessLetterSchema = new ActionSchema("guessLetter", {
  letter: SolidityType.STRING,
  nonce: SolidityType.UINT,
  player: SolidityType.STRING,
});

export const schemas = {
  createGame: createGameSchema,
  guessLetter: guessLetterSchema,
};

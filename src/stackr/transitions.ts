import { Transitions, STF } from "@stackr/sdk/machine";
import { Hangman, HangmanState } from "./machine";
import { calculateCurrentProgress, calculateGameStatus } from "./utils.ts";

type CreateGameInput = {
  word: string;
  creator: string;
};

type GuessLetterInput = {
  letter: string;
  player: string;
};

// --------- State Transition Handlers ---------
const createGame: STF<Hangman, CreateGameInput> = {
  handler: ({ inputs, state }) => {
    const { word, creator} = inputs;
    if (state.TargetWord.length > 0) {
      throw new Error("Game is already in progress");
    }
    if (word.length === 0) {
      throw new Error("Word must not be empty");
    }
    // word should be alpha numeric optionally with spaces
    if (!word.match(/^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/)) {
      throw new Error("Word must be alphanumeric with spaces");
    }
    state.TargetWord = word.toLowerCase();
    state.GameCreator = creator;
    state.GameID = state.GameID + 1;
    state = calculateCurrentProgress(state);
    return state;
  },
};

const guessLetter: STF<Hangman, GuessLetterInput> = {
  handler: ({ inputs, state }) => {
    if (state.TargetWord.length === 0) {
      throw new Error("Game is not in progress");
    }
    const { letter, player } = inputs;
    if (player === state.GameCreator) {
      throw new Error("Game creator cannot guess the letter");
    }
    if (letter.length !== 1) {
      throw new Error("Letter must be a single character");
    }
    // should be alpha numeric
    if (!letter.match(/^[a-zA-Z0-9]$/)) {
      throw new Error("Letter must be alphanumeric");
    }
    if (!state["Players"][player]) {
      state["Players"][player] = {
        CorrectGuesses: 0,
      };
    }

    const l = letter.toLowerCase();
    if (state["TargetWord"].includes(l)) {
      state["GuessedLetters"] = [...state["GuessedLetters"], l]; // Assuming GuessedLetters is initially an array
      state["Players"][player].CorrectGuesses++;
    } else {
      state["IncorrectGuesses"]++;
    }

    state = calculateCurrentProgress(state);
    state = calculateGameStatus(state);
    return state;
  },
};

export const reducers: Transitions<Hangman> = {
  createGame,
  guessLetter,
};

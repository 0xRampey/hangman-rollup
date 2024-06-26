import { Transitions, STF } from "@stackr/sdk/machine";
import { Hangman, HangmanState } from "./machine";
import { resetGame, isGameWon, isGameLost } from "./utils.ts";

type CreateGameInput = {
  word: string;
  creator: string;
  hint: string;
};

type GuessLetterInput = {
  letter: string;
  player: string;
};

// --------- State Transition Handlers ---------
const createGame: STF<Hangman, CreateGameInput> = {
  handler: ({ inputs, state }) => {
    // First check if a game is already in progress
    if (isGameWon(state) || isGameLost(state)) {
      // Reset game on win or loss
      state = resetGame(state);
    } else {
      throw new Error("A game is already in progress!");
    }

    const { word, creator, hint } = inputs;

    if (hint.length === 0) {
      throw new Error("Hint cannot be empty!");
    }
    // Checks for word validity
    if (word.length === 0) {
      throw new Error("Word cannot be empty!");
    }
    // word should be alpha numeric optionally with spaces
    if (!word.match(/^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/)) {
      throw new Error("Word must be alphanumeric with spaces");
    }
    state.TargetWord = word.toLowerCase();
    state.GameCreator = creator;
    state.GameID = state.GameID + 1;
    state.Hint = hint;
    return state;
  },
};

const guessLetter: STF<Hangman, GuessLetterInput> = {
  handler: ({ inputs, state }) => {
    if (isGameWon(state) || isGameLost(state)) {
      throw new Error("The game is not in progress. Create a game first!");
    }

    const { letter, player } = inputs;
    if (player === state.GameCreator) {
      throw new Error("The game creator cannot guess the word!");
    }
    if (letter.length !== 1) {
      throw new Error("Guess must be a single letter!");
    }
    // should be alpha numeric
    if (!letter.match(/^[a-zA-Z0-9]$/)) {
      throw new Error("Your guess must be alphanumeric");
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

    return state;
  },
};

export const reducers: Transitions<Hangman> = {
  createGame,
  guessLetter,
};

import { Transitions, STF } from "@stackr/sdk/machine";
import { Hangman, HangmanState } from "./machine";

// --------- Utilities ---------

const calculateCurrentProgress = (state: HangmanState) => {
  const guessedLettersSet = new Set(state.GuessedLetters); // Convert array to Set
  const display = Array.from(state.TargetWord)
      .map(letter => guessedLettersSet.has(letter) ? letter : '_')
      .join(' ');
  state.Progress = `Current progress: ${display}\n`;
  state.Progress += `Remaining attempts: ${6 - state.IncorrectGuesses}\n`;
  state.Progress += state.HangmanStages[Math.min(state.IncorrectGuesses, 6)];
  return state;
};  

const calculateGameStatus = (state: HangmanState) => {
  const guessedLettersSet = new Set(state.GuessedLetters); // Convert array to Set
  const isWinner = Array.from(state.TargetWord).every(letter => guessedLettersSet.has(letter));

  if (isWinner) {
    state.Progress += "\nCongratulations, you have won the game!\n";
    state.IncorrectGuesses = 0;
    state.GuessedLetters = [];
    state.TargetWord = "";
  } else if (state.IncorrectGuesses >= 6) {
    state.Progress += `\nSorry, you've lost the game. \nThe word was: ${state.TargetWord}\n`;
    state.Progress += state.HangmanStages[6]; // Show the final stage
  }
  return state;
}

type CreateGameInput = {
  word: string;
  numPlayers: number;
};

type GuessLetterInput = {
  letter: string;
};

// --------- State Transition Handlers ---------
const createGame: STF<Hangman, CreateGameInput> = {
  handler: ({inputs, state }) => {
    const { word, numPlayers } = inputs;
    if (state. TargetWord.length > 0) {
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
    state.NumPlayers = numPlayers;
    state = calculateCurrentProgress(state);
    console.log(state);
    return state;
  },
};

const guessLetter: STF<Hangman, GuessLetterInput> = {
  handler: ({ inputs, state, msgSender }) => {
    if (state.TargetWord.length === 0) {
      throw new Error("Game is not in progress");
    }
    const { letter } = inputs;
    if (letter.length !== 1) {
      throw new Error("Letter must be a single character");
    }
    // should be alpha numeric
    if (!letter.match(/^[a-zA-Z0-9]$/)) {
      throw new Error("Letter must be alphanumeric");
    }
    const l = letter.toLowerCase();
    if (state["TargetWord"].includes(l)) {
      state["GuessedLetters"] = [...state["GuessedLetters"], l]; // Assuming GuessedLetters is initially an array
    } else {
      state["IncorrectGuesses"]++;
    }

    state = calculateCurrentProgress(state);
    state = calculateGameStatus(state);
    console.log(state);
    return state;
  },
};

export const reducers: Transitions<Hangman> = {
  createGame,
  guessLetter,
};

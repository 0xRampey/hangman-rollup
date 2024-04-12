import { Transitions, STF } from "@stackr/sdk/machine";
import { Hangman, HangmanState } from "./machine";

// --------- Utilities ---------

const calculateCurrentProgress = (state: HangmanState) => {
  const guessedLettersSet = new Set(state.GuessedLetters); // Convert array to Set
  const display = Array.from(state.TargetWord)
      .map(letter => guessedLettersSet.has(letter) ? letter : letter === ' ' ? ' ' : '_')
      .join(' ');
  state.Progress = `Current progress: ${display}\n`;
  state.Progress += `Remaining attempts: ${6 - state.IncorrectGuesses}\n`;
  state.Progress += state.HangmanStages[Math.min(state.IncorrectGuesses, 6)];
  return state;
};  

const calculateGameStatus = (state: HangmanState) => {
  const guessedLettersSet = new Set(state.GuessedLetters); // Convert array to Set
  const isWinner = Array.from(state.TargetWord).filter(letter => letter !== ' ').every(letter => guessedLettersSet.has(letter));

  if (isWinner) {
    state.Progress += "\nCongratulations, you've beaten the game!\n";
    for (const [address, player] of Object.entries(state.Players)) {
      state.Progress += `Player ${address} has ${player.CorrectGuesses} correct guesses.\n`;
    }
  
    // Reset the game
    state = resetGame(state);
  } else if (state.IncorrectGuesses >= 6) {
    state.Progress += `\nSorry, you've lost the game. \nThe word was: ${state.TargetWord}\n`;
    state.Progress += state.HangmanStages[6]; // Show the final stage
    state = resetGame(state);
  }
  return state;
}

const resetGame = (state: HangmanState) => {
  state.Players = {};
  state.IncorrectGuesses = 0;
  state.GuessedLetters = [];
  state.TargetWord = "";
  state.GameID = "";
  state.GameCreator = "";
  state.NumPlayers = 0;
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
  handler: ({ inputs, state, msgSender }) => {
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
    state.GameCreator = msgSender;
    state.GameID = Math.random().toString(36);
    state = calculateCurrentProgress(state);
    return state;
  },
};

const guessLetter: STF<Hangman, GuessLetterInput> = {
  handler: ({ inputs, state, msgSender }) => {
    if (state.TargetWord.length === 0) {
      throw new Error("Game is not in progress");
    }
    const { letter } = inputs;
    if (msgSender === state.GameCreator) {
      throw new Error("Game creator cannot guess the letter");
    }
    if (letter.length !== 1) {
      throw new Error("Letter must be a single character");
    }
    // should be alpha numeric
    if (!letter.match(/^[a-zA-Z0-9]$/)) {
      throw new Error("Letter must be alphanumeric");
    }
    if (!state["Players"][msgSender.toString()]) {
      state["Players"][msgSender.toString()] = {
        CorrectGuesses: 0,
      }
    }

    const l = letter.toLowerCase();
    if (state["TargetWord"].includes(l)) {
      state["GuessedLetters"] = [...state["GuessedLetters"], l]; // Assuming GuessedLetters is initially an array
      state["Players"][msgSender.toString()].CorrectGuesses++;
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


import { HangmanState } from "./machine.ts";

// --------- Utilities ---------
  
  const resetGame = (state: HangmanState) => {
    state.Players = {};
    state.IncorrectGuesses = 0;
    state.GuessedLetters = [];
    state.TargetWord = "";
    state.GameCreator = "";
    state.NumPlayers = 0;
    state.Hint = "";
    return state;
  };

  function isGameWon(state: HangmanState): boolean {
    const guessedLettersSet = new Set(state.GuessedLetters); // Convert array to Set
    const isWinner = Array.from(state.TargetWord)
      .filter((letter) => letter !== " ")
      .every((letter) => guessedLettersSet.has(letter));
    return isWinner;
  };

  function isGameLost(state: HangmanState): boolean {
    return state.IncorrectGuesses >= 6;
  }

  export { resetGame, isGameWon, isGameLost };


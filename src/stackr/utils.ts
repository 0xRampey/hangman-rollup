import { HangmanState } from "./machine.ts";

// --------- Utilities ---------

const calculateCurrentProgress = (state: HangmanState) => {
    const guessedLettersSet = new Set(state.GuessedLetters); // Convert array to Set
    const display = Array.from(state.TargetWord)
      .map((letter) =>
        guessedLettersSet.has(letter) ? letter : letter === " " ? " " : "_",
      )
      .join(" ");
    state.Progress = `Current progress: ${display}\n`;
    state.Progress += `Remaining attempts: ${6 - state.IncorrectGuesses}\n`;
    state.Progress += state.HangmanStages[Math.min(state.IncorrectGuesses, 6)];
    return state;
  };
  
  const calculateGameStatus = (state: HangmanState) => {
    const guessedLettersSet = new Set(state.GuessedLetters); // Convert array to Set
    const isWinner = Array.from(state.TargetWord)
      .filter((letter) => letter !== " ")
      .every((letter) => guessedLettersSet.has(letter));
  
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
  };
  
  const resetGame = (state: HangmanState) => {
    state.Players = {};
    state.IncorrectGuesses = 0;
    state.GuessedLetters = [];
    state.TargetWord = "";
    state.GameCreator = "";
    state.NumPlayers = 0;
    return state;
  };

  export { calculateCurrentProgress, calculateGameStatus, resetGame };


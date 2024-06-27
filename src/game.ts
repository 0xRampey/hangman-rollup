import { isGameWon, isGameLost } from "./stackr/utils.ts";
import { HangmanState } from "./stackr/machine.ts";

function calculateGameProgress(state: HangmanState): string {
    var progress = ""
    if (!isGameInProgress(state)) {
      // No game creator, so no game in progress
      return "Welcome to 8-bit Hangman! \nStart a new game by entering a word!"
    }
    
      const guessedLettersSet = new Set(state.GuessedLetters); // Convert array to Set
      const display = Array.from(state.TargetWord)
        .map((letter) =>
          guessedLettersSet.has(letter) ? letter : letter === " " ? " " : "_",
        )
        .join(" ");
      progress = `Current progress: ${display}\n`;
      progress += `Remaining attempts: ${6 - state.IncorrectGuesses}\n`;
      progress += state.HangmanStages[Math.min(state.IncorrectGuesses, 6)];
      if (isGameWon(state)) {
        progress += "\nCongratulations, the game has been beaten!\n";
        for (const [address, player] of Object.entries(state.Players)) {
          progress += `Player ${address} got ${player.CorrectGuesses} correct guesses.\n`;
        }
      } else if (isGameLost(state)) {
        progress += `\nGame over! The word was: ${state.TargetWord}\n`;
      }
  
      return progress;
    };

    function isGameInProgress(state: HangmanState): boolean {
      return state.GameCreator !== "";
    }

export { calculateGameProgress, isGameInProgress };


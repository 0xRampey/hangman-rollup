import { isGameWon, isGameLost } from "./stackr/utils.ts";
import { HangmanState } from "./stackr/machine.ts";

function calculateGameProgress(state: HangmanState): string {
    var progress = ""
    if (state.GameCreator == "") {
      // No game creator, so no game in progress
      return "Welcome to Hangman! Start a new game by entering a word!"
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
        progress += "\nCongratulations, you've beaten the game!\n";
        for (const [address, player] of Object.entries(state.Players)) {
          progress += `Player ${address} has ${player.CorrectGuesses} correct guesses.\n`;
        }
      } else if (isGameLost(state)) {
        progress += `\nSorry, you've lost the game. \nThe word was: ${state.TargetWord}\n`;
        progress += state.HangmanStages[6]; // Show the final stage
      }
  
      return progress;
    };

export { calculateGameProgress };


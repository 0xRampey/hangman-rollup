import { isGameWon, isGameLost } from "./stackr/utils.ts";
import { HangmanState } from "./stackr/machine.ts";

function calculateGameProgress(state: HangmanState): string {
    var progress = ""
      const guessedLettersSet = new Set(state.GuessedLetters); // Convert array to Set
      const display = Array.from(state.TargetWord)
        .map((letter) =>
          guessedLettersSet.has(letter) ? letter : letter === " " ? " " : "_",
        )
        .join(" ");
      progress = `Hint: ${state.Hint}\n`;
      progress += `Current progress: ${display}\n`;
      progress += `Remaining attempts: ${6 - state.IncorrectGuesses}\n`;
      progress += state.HangmanStages[Math.min(state.IncorrectGuesses, 6)];
      if (isGameWon(state)) {
        progress += "\nCongratulations, the game has been beaten!\n";
        for (const [address, player] of Object.entries(state.Players)) {
          progress += `Player with FID ${address} got ${player.CorrectGuesses} correct guesses.\n`;
        }
      } else if (isGameLost(state)) {
        progress += `\nGame over! The word was: ${state.TargetWord}\n`;
      }
  
      return progress;
    };

    function isGameInProgress(state: HangmanState): boolean {
      return state.GameCreator !== "" && !isGameLost(state) && !isGameWon(state);
    }

export { calculateGameProgress, isGameInProgress };


import { State, StateMachine } from "@stackr/sdk/machine";
import genesisState from "../../genesis-state.json";
import { reducers } from "./transitions";
import { ethers, BytesLike } from "ethers";
import { AddressLike } from "ethers";

export type HangmanState = {
  TargetWord: string;
  NumPlayers: number;
  GameCreator: AddressLike;
  GameID: string;
  GuessedLetters: string[];
  IncorrectGuesses: number;
  Players: {
    [key: string]: {
      CorrectGuesses: number;
    };
  };
  Progress: string;
  HangmanStages: string[];
};

export class Hangman extends State<HangmanState> {
  constructor(state: HangmanState) {
    super(state);
  }

  getRootHash(): BytesLike {
    return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(this.state)));
  }
}
const machine = new StateMachine({
  id: "hangman", 
  stateClass: Hangman,
  initialState: genesisState.state,
  on: reducers,
});

export { machine };

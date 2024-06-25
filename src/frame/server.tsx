import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
import { ActionConfirmationStatus } from "@stackr/sdk";
import { schemas } from "../stackr/action.ts";
import { mru} from "../rollup.ts";
import { calculateGameProgress } from "../game.ts";
import { reducers } from "../stackr/transitions.ts";
import { HangmanState } from "../stackr/machine.ts";
import { stackrConfig } from "../../stackr.config.ts";
import { Wallet } from "ethers";
import { getImage } from "./image.tsx";


 
export const app = new Frog()

const { actions, chain, events } = mru;
 
app.frame('/', async (c) => {
  const { buttonValue, inputText } = c
  const address = c.frameData?.address
  const fid = c.frameData?.fid
  var error = ""

  if (!fid) {
    return c.res({
      image: getImage(getState(), error),
      intents: getIntents()
    })
  }
  
  // No button press so prolly first render
  if (buttonValue === undefined) {
    // First render for user
    return c.res({
      image: getImage(getState(), error),
      intents: getIntents()
    })
}
  const guess = inputText
  const actionReducer = reducers[buttonValue];

  if (guess === undefined) {
    error = "Choose a letter to guess willya?"
    return c.res({
      image: getImage(getState(), error),
      intents: getIntents()
    })
  }

  if (!actionReducer) {
    error = "no reducer for action"
    console.error("No reducer for action", buttonValue);
    return c.res({
      image: getImage(getState(), error),
      intents: getIntents()
    })
  }
  const action = buttonValue as keyof typeof schemas;
  const schema = schemas[action];
  const { msgSender, signature, inputs } = await getBody(action, guess, fid.toString()) as {
    msgSender: string;
    signature: string;
    inputs: any;
  };
  try {
    const newAction = schema.actionFrom({ inputs, msgSender, signature });
    const ack = await mru.submitAction(action, newAction);
    var error = await ack.waitFor(ActionConfirmationStatus.C1).then((action) => {
      if (action.confirmationStatus === ActionConfirmationStatus.C1) {
        console.log("action confirmed", action)
        return ""
      }
      if (action.confirmationStatus === ActionConfirmationStatus.C1X) {
        console.log("action reverted")
        return action.errors?.[0].message || "Action failed to execute! Please try again."
      }
      return "Unknown error occurred! Please try again.";
    })
  } catch (e: any) {
    console.error(e)
    error = e.message
  }
  console.log("error", error)
  return c.res({
    image: getImage(getState(), error),
    intents: getIntents()
  })
})
 
devtools(app, { serveStatic })

type ActionName = keyof typeof schemas;
const walletOne = new Wallet(
  "0x0123456789012345678901234567890123456789012345678901234567890123",
);

const { domain } = stackrConfig;

const getBody = async (
  actionName: ActionName,
  data: string,
  casterFID: string,
) => {
  const inputs =
    actionName === "createGame"
      ? {
          word: data,
          creator: casterFID,
        }
      : {
          letter: data,
          nonce: Date.now(),
          player: casterFID,
        };
console.log("signing", inputs)
  const signature = await walletOne.signTypedData(
    domain,
    schemas[actionName].EIP712TypedData.types,
    inputs,
  );
  console.log("signature", signature)

  return {
    msgSender: walletOne.address,
    signature,
    inputs,
  };
};

function getState() {
  const state = mru.stateMachines.getFirst()?.state as HangmanState
  const progress = calculateGameProgress(state)
  if (progress === "") {
    return "Welcome to 8-bit Hangman! \nStart a new game by entering a word!"
  }
  return progress
}

function getIntents() {
  return [
    <TextInput placeholder="Enter word/letter" />,
    <Button value="createGame">Create Game</Button>,
    <Button value="guessLetter">Guess Letter</Button>,
  ]
}


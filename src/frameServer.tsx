import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
import { serve } from '@hono/node-server'
import { ActionEvents, ActionExecutionStatus } from "@stackr/sdk";
import { schemas } from "./stackr/action.ts";
import { mru } from "./rollup.ts";
import { reducers } from "./stackr/transitions.ts";
import { HangmanState } from "./stackr/machine.ts";
import { stackrConfig } from "../stackr.config.ts";
import { Wallet } from "ethers";

 
export const app = new Frog()

const { actions, chain, events } = mru;
 
app.frame('/', async (c) => {
  const { buttonValue, inputText } = c
  const address = c.frameData?.address
  const fid = c.frameData?.fid
  var error = ""

  if (!fid) {
    error = "Please connect your wallet"
    return c.res({
      image: getImage(getState(), error),
      intents: getIntents()
    })
  }
  console.log("fid", fid)
  
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
    console.error("Guess is required.");
    error = "Guess is required."
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
    const actionHash = ack.actionHash;
    error = await new Promise((resolve) => {
      events.subscribe(ActionEvents.EXECUTION_STATUS, (action) => {
        if (action.actionHash === actionHash) {
          if (action.status === ActionExecutionStatus.ACCEPTED) {
            console.log(`Action ${actionHash} executed successfully.`);
            resolve('')
          } else if (action.status === ActionExecutionStatus.REVERTED) {
            console.error(`Action ${actionHash} failed to executed.`);
            resolve('Action failed to execute! Please try again.')
          }
        }
      });
    });
    console.log("error", error)
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
  if (state.Progress === "") {
    return "Welcome to Hangman! Start a new game by entering a word!"
  }
  return state.Progress
}

function getImage(state: string, error: string) {
  return (
  <div
  style={{
    alignItems: 'center',
    background: 'linear-gradient(to right, #432889, #17101F)',
    backgroundSize: '100% 100%',
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    height: '100%',
    justifyContent: 'center',
    textAlign: 'center',
    width: '100%',
  }}
>
  <div
    style={{
      color: 'white',
      fontSize: 30,
      fontStyle: 'normal',
      letterSpacing: '-0.025em',
      lineHeight: 1.4,
      marginTop: 30,
      padding: '0 120px',
      whiteSpace: 'pre-wrap',
    }}
  >
    {state}
  </div>
{ error && <div
  style={{
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  }}
>
  {error}
</div>
}
</div>
  )
}

function getIntents() {
  return [
    <TextInput placeholder="Enter word/letter" />,
    <Button value="createGame">Create Game</Button>,
    <Button value="guessLetter">Guess Letter</Button>,
  ]
}


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

function getImage(state: string, error: string) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: '#000',
        backgroundImage: `
          linear-gradient(0deg, transparent 24%, rgba(32, 255, 77, .05) 25%, rgba(32, 255, 77, .05) 26%, transparent 27%, transparent 74%, rgba(32, 255, 77, .05) 75%, rgba(32, 255, 77, .05) 76%, transparent 77%, transparent),
          linear-gradient(90deg, transparent 24%, rgba(32, 255, 77, .05) 25%, rgba(32, 255, 77, .05) 26%, transparent 27%, transparent 74%, rgba(32, 255, 77, .05) 75%, rgba(32, 255, 77, .05) 76%, transparent 77%, transparent)
        `,
        backgroundSize: '50px 50px',
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
          color: '#0f0',
          fontFamily: '"Press Start 2P", "Courier New", monospace',
          fontSize: 24,
          fontStyle: 'normal',
          letterSpacing: '0.1em',
          lineHeight: 1.6,
          padding: '30px',
          whiteSpace: 'pre-wrap',
          textShadow: '0 0 5px #0f0, 0 0 10px #0f0',
          border: '4px solid #0f0',
          boxShadow: '0 0 10px #0f0, inset 0 0 10px #0f0',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          maxWidth: '80%',
        }}
      >
        {state}
      </div>
      {error && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#000',
            color: '#f00',
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            fontSize: 12,
            padding: '10px',
            border: '2px solid #f00',
            boxShadow: '0 0 5px #f00, inset 0 0 5px #f00',
            zIndex: 1000,
            textTransform: 'uppercase',
            lineHeight: 1.4,
            maxWidth: '200px',
            wordWrap: 'break-word',
          }}
        >
         {error}
        </div>
      )}
      <style>
        {`
          @font-face {
            font-family: 'Press Start 2P';
            src: url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          }
          @keyframes glow {
            from {
              text-shadow: 0 0 5px #0f0, 0 0 10px #0f0, 0 0 15px #0f0, 0 0 20px #0f0;
            }
            to {
              text-shadow: 0 0 10px #0f0, 0 0 20px #0f0, 0 0 30px #0f0, 0 0 40px #0f0;
            }
          }
        `}
      </style>
    </div>
  );
}

function getIntents() {
  return [
    <TextInput placeholder="Enter word/letter" />,
    <Button value="createGame">Create Game</Button>,
    <Button value="guessLetter">Guess Letter</Button>,
  ]
}


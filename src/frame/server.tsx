import { ActionConfirmationStatus } from "@stackr/sdk";
import { Wallet } from "ethers";
import { Button, FrameContext, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
import { stackrConfig } from "../../stackr.config.ts";
import { calculateGameProgress, isGameInProgress } from "../game.ts";
import { mru } from "../rollup.ts";
import { schemas } from "../stackr/action.ts";
import { isGameLost, isGameWon } from "../stackr/utils.ts";
import { getImage, getWelcomeScreen } from "./image.tsx";

type State = {
  gameWord: string;
};

export const app = new Frog<{ State: State }>({
  initialState: {
    gameWord: "",
  },
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' }),
});

const { actions, chain, events } = mru;

app.frame("/welcome", async (c) => {
  return c.res({
    image: getWelcomeScreen(),
    intents: [
      <Button value="play" action="/play">
        Play 🕹
      </Button>,
    ],
  });
});

function currentGame(rollupState: any, error: string, c: FrameContext) {
  if (isGameLost(rollupState) || isGameWon(rollupState)) {
    return c.res({
      image: getImage(calculateGameProgress(rollupState), error),
      intents: [
        <Button value="restartGame" action="/welcome">
          Restart game 🔄
        </Button>,
      ],
    });
  }
  return c.res({
    image: getImage(calculateGameProgress(rollupState), error),
    intents: [
      <TextInput placeholder="Enter letter" />,
      <Button value="guessLetter" action="/guess">
        Guess Letter
      </Button>,
    ],
  });
}

app.frame("/play", async (c) => {
  const { deriveState } = c;
  const fid = c.frameData?.fid as number;
  var error = "";

  const rollupState = mru.stateMachines.getFirst()?.state;

  if (isGameInProgress(rollupState)) {
    return currentGame(rollupState, "", c as FrameContext);
  }
  return c.res({
    image: getImage(
      "Welcome to 8-bit Hangman! \nStart a new game by entering a word!",
      ""
    ),
    intents: [
      <TextInput placeholder="Enter word" />,
      <Button value="newGame" action="/hint">
        Enter word
      </Button>,
    ],
  });
});

app.frame("/hint", async (c) => {
  const { inputText, deriveState } = c;
  deriveState((state) => {
    state.gameWord = inputText || "";
  });
  return c.res({
    image: getImage("Enter a hint to help the player guess the word", ""),
    intents: [
      <TextInput placeholder="Enter hint" />,
      <Button value="createGame" action="/createGame">
        Go 🏁
      </Button>,
    ],
  });
});

app.frame("/guess", async (c) => {
  const { inputText, deriveState } = c;
  const fid = c.frameData?.fid as number;
  var error = "";
  const guess = inputText as string;
  const action = "guessLetter" as keyof typeof schemas;
  const schema = schemas[action];
  const { msgSender, signature, inputs } = (await getBody(
    action,
    guess,
    fid.toString(),
    deriveState().gameWord
  )) as {
    msgSender: string;
    signature: string;
    inputs: any;
  };
  try {
    const newAction = schema.actionFrom({ inputs, msgSender, signature });
    const ack = await mru.submitAction(action, newAction);
    var error = await ack
      .waitFor(ActionConfirmationStatus.C1)
      .then((action) => {
        if (action.confirmationStatus === ActionConfirmationStatus.C1) {
          console.log("action confirmed", action);
          return "";
        }
        if (action.confirmationStatus === ActionConfirmationStatus.C1X) {
          console.log("action reverted");
          return (
            action.errors?.[0].message ||
            "Action failed to execute! Please try again."
          );
        }
        return "Unknown error occurred! Please try again.";
      });
  } catch (e: any) {
    console.error(e);
    error = e.message;
  }
  const rollupState = mru.stateMachines.getFirst()?.state;
  return currentGame(rollupState, error, c as FrameContext);
});

app.frame("/createGame", async (c) => {
  const { deriveState, inputText } = c;
  const hint = inputText as string;
  const fid = c.frameData?.fid as number;
  var error = "";
  // If game not in progress, check if game word has been set
  // If game word has been set, start a new game
  const { msgSender, signature, inputs } = (await getBody(
    "createGame",
    hint,
    fid.toString(),
    deriveState().gameWord
  )) as {
    msgSender: string;
    signature: string;
    inputs: any;
  };
  const schema = schemas["createGame"];
  try {
    const newAction = schema.actionFrom({ inputs, msgSender, signature });
    const ack = await mru.submitAction("createGame", newAction);
    var error = await ack
      .waitFor(ActionConfirmationStatus.C1)
      .then((action) => {
        if (action.confirmationStatus === ActionConfirmationStatus.C1) {
          console.log("action confirmed", action);
          return "";
        }
        if (action.confirmationStatus === ActionConfirmationStatus.C1X) {
          console.log("action reverted");
          return (
            action.errors?.[0].message ||
            "Action failed to execute! Please try again."
          );
        }
        return "Unknown error occurred! Please try again.";
      });
  } catch (e: any) {
    console.error(e);
    error = e.message;
  }

  const rollupState = mru.stateMachines.getFirst().state;
  if (error === "" || isGameInProgress(rollupState)) {
    return currentGame(rollupState, error, c as FrameContext);
  }
  return c.res({
    image: getImage(
      "Welcome to 8-bit Hangman! \nStart a new game by entering a word!",
      error
    ),
    intents: [
      <TextInput placeholder="Enter word" />,
      <Button value="newGame" action="/hint">
        Enter word
      </Button>,
    ],
  });
});

type ActionName = keyof typeof schemas;
const walletOne = new Wallet(
  "0x0123456789012345678901234567890123456789012345678901234567890123"
);

const { domain } = stackrConfig;

const getBody = async (
  actionName: ActionName,
  data: string,
  casterFID: string,
  gameWord: string
) => {
  const inputs =
    actionName === "createGame"
      ? {
          word: gameWord,
          creator: casterFID,
          hint: data,
        }
      : {
          letter: data,
          nonce: Date.now(),
          player: casterFID,
        };
  console.log("signing", inputs);
  const signature = await walletOne.signTypedData(
    domain,
    schemas[actionName].EIP712TypedData.types,
    inputs
  );
  console.log("signature", signature);

  return {
    msgSender: walletOne.address,
    signature,
    inputs,
  };
};

devtools(app, { serveStatic });

// Bun.serve({
//   fetch: app.fetch,
//   port: 3000,
// })
// console.log('Server is running on port 3000')

import express, { Request, Response } from "express";

import { ActionEvents, ActionExecutionStatus } from "@stackr/sdk";
import { Playground } from "@stackr/sdk/plugins";
import { schemas } from "../stackr/action.ts";
import { mru } from "../rollup.ts";
import { reducers } from "../stackr/transitions.ts";
import { HangmanState } from "../stackr/machine.ts";
import { stackrConfig } from "../../stackr.config.ts";

const { domain } = stackrConfig;

console.log("Starting server...");

// const hangmanMachine = mru.stateMachines.get<HangmanMachine>("hangman");

const app = express();
app.use(express.json());

const playground = Playground.init(mru);

playground.addGetMethod(
  "/custom/hello",
  async (_req: Request, res: Response) => {
    res.send("Hello World");
  },
);

const { events } = mru;

app.post("/:reducerName", async (req: Request, res: Response) => {
  const { reducerName } = req.params;
  const actionReducer = reducers[reducerName];

  if (!actionReducer) {
    res.status(400).send({ message: "no reducer for action" });
    return;
  }
  const action = reducerName as keyof typeof schemas;

  const { msgSender, signature, inputs } = req.body as {
    msgSender: string;
    signature: string;
    inputs: any;
  };

  const schema = schemas[action];

  try {
    const newAction = schema.actionFrom({ inputs, msgSender, signature });
    const ack = await mru.submitAction(reducerName, newAction);
    const actionHash = ack.actionHash;
    await new Promise((resolve) => {
      events.subscribe(ActionEvents.EXECUTION_STATUS, (action) => {
        if (action.actionHash === actionHash) {
          if (action.status === ActionExecutionStatus.ACCEPTED) {
            console.log(`Action ${actionHash} executed successfully.`);
            res.status(200).send({ message: 'Action executed successfully', details: { actionHash, status: action.status } });
          } else if (action.status === ActionExecutionStatus.REVERTED) {
            console.log(`Action ${actionHash} failed to execute.`);
            res.status(400).send({ error: 'Action failed to execute', details: { actionHash, status: action.status } });
          }
          resolve(res);
        }
      });
    });
  } catch (e: any) {
    res.status(400).send({ error: e.message });
  }
  return;
});

app.get("/", (_req: Request, res: Response) => {
  const state = mru.stateMachines.getFirst()?.state as HangmanState;
  const htmlContent = `
  <html>
    <head>
      <title>Hangman, the Game</title>
      <script src="https://cdn.ethers.io/lib/ethers-5.2.umd.min.js"></script>
      <script>
        let signer;  // This will hold the signer object once the user connects their wallet
        var gameID = "";
        // Function to connect to MetaMask
        async function connectWallet() {
          if (typeof window.ethereum !== 'undefined') {
            try {
              await ethereum.request({ method: 'eth_requestAccounts' });
              signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
              console.log("Wallet connected:", await signer.getAddress());
            } catch (error) {
              console.error("User denied account access");
            }
          } else {
            console.log("MetaMask is not installed!");
            alert("Please install MetaMask to use this feature.");
          }
        }

        const schemas = ${JSON.stringify(schemas)};
        const domain = ${JSON.stringify(domain)};

        async function sendRequest(actionName, data, numPlayers) {
          if (!signer) {
            alert("Please connect your wallet first!");
            return;
          }
          const body = await getSignedBody(actionName, data, numPlayers);
          const response = await fetch(\`/\${actionName}\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body
          });
          const result = await response.json();
          console.log(result);
        }

        async function getSignedBody(actionName, data, numPlayers) {
          const inputs = actionName === "createGame"
            ? { word: data, numPlayers: Number(numPlayers) }
            : { letter: data, gameID: gameID };

          const schema = actionName === "createGame"
            ? ${JSON.stringify(schemas["createGame"].EIP712TypedData.types)}
            : ${JSON.stringify(schemas["guessLetter"].EIP712TypedData.types)};

          console.log("schema", schema);
          console.log("inputs", inputs);
          console.log("domain", domain);
          const signature = await signer._signTypedData(domain, schema, inputs);

          return JSON.stringify({
            msgSender: await signer.getAddress(),
            signature,
            inputs,
            randomString: Math.random().toString(36).substring(2, 12)
          });
        }
        // Function to update the game state periodically
      async function updateGameState() {
        try {
          const response = await fetch('/gameState');  // Adjust the endpoint as necessary
          const gameState = await response.json();
          gameID = gameState.GameID;
          document.getElementById('gameState').innerText = gameState.Progress;  // Adjust how you display based on response structure
        } catch (error) {
          console.error('Failed to fetch game state:', error);
          document.getElementById('gameState').innerText = 'Failed to fetch game state';
        }
      }

      // Set up periodic polling, e.g., every 5 seconds
      setInterval(updateGameState, 100);
      </script>
    </head>
    <body>
      <h1>Hangman Game</h1>
      <button onclick="connectWallet()">Connect Wallet</button>
      <input type="text" id="inputWord" placeholder="Enter word or letter" />
      <button onclick="sendRequest('createGame', document.getElementById('inputWord').value, '2')">Create Game</button>
      <button onclick="sendRequest('guessLetter', document.getElementById('inputWord').value)">Guess Letter</button>
      <pre id="gameState" style="font-size: 50px">${state.Progress}</pre>
    </body>
  </html>
  `;
  return res.send(htmlContent);
});

app.get("/gameState", (_req: Request, res: Response) => {
  const state = mru.stateMachines.getFirst()?.state as HangmanState;
  res.send(state);
});

app.listen(8080, () => {
  console.log("listening on port 8080");
});


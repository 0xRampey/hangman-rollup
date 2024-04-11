import express, { Request, Response } from "express";

import { ActionEvents } from "@stackr/sdk";
import { Playground } from "@stackr/sdk/plugins";
import { schemas } from "./stackr/actions.ts";
import { mru } from "./hangman.ts";
import { reducers } from "./stackr/transitions.ts";
import { HangmanState } from "./stackr/machine.ts";

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

const { actions, chain, events } = mru;

app.get("/actions/:hash", async (req: Request, res: Response) => {
  const { hash } = req.params;
  const action = await actions.getByHash(hash);
  if (!action) {
    return res.status(404).send({ message: "Action not found" });
  }
  return res.send(action);
});

app.get("/blocks/:hash", async (req: Request, res: Response) => {
  const { hash } = req.params;
  const block = await chain.getBlockByHash(hash);
  if (!block) {
    return res.status(404).send({ message: "Block not found" });
  }
  return res.send(block.data);
});

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
    res.status(201).send({ ack });
  } catch (e: any) {
    res.status(400).send({ error: e.message });
  }
  return;
});

events.subscribe(ActionEvents.SUBMIT, (args) => {
  console.log("Submitted an action", args);
});

events.subscribe(ActionEvents.EXECUTION_STATUS, async (action) => {
  console.log("Submitted an action", action);
});

app.get("/", (_req: Request, res: Response) => {
  const state = mru.stateMachines.getFirst()?.state as HangmanState;
  return res.send(`<pre style="font-size: 100px">${state.Progress}</pre>`);
});

app.listen(8080, () => {
  console.log("listening on port 8080");
});


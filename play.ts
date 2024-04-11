import { Wallet } from "ethers";
import { schemas } from "./src/stackr/actions";
import { stackrConfig } from "./stackr.config";

const { domain } = stackrConfig;

type ActionName = keyof typeof schemas;

const walletOne = new Wallet(
  "0x0123456789012345678901234567890123456789012345678901234567890123",
);
const walletTwo = new Wallet(
  "0x0123456789012345678901234567890123456789012345678901234567890124",
);

const getBody = async (
  actionName: ActionName,
  data: string,
  numPlayers: string,
) => {
  const inputs =
    actionName === "createGame"
      ? {
          word: data,
          numPlayers: Number(numPlayers),
        }
      : {
          letter: data,
        };

  const signature = await walletOne.signTypedData(
    domain,
    schemas[actionName].EIP712TypedData.types,
    inputs,
  );

  const body = JSON.stringify({
    msgSender: walletOne.address,
    signature,
    inputs,
    // Add random non-empty string of length 10
    randomString: Math.random().toString(36).substring(2, 12),
  });

  return body;
};

const run = async (
  actionName: ActionName,
  data: string,
  numPlayers: string,
) => {
  const start = Date.now();
  const body = await getBody(actionName, data, numPlayers);

  const res = await fetch(`http://localhost:8080/${actionName}`, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const end = Date.now();
  const json = await res.json();

  const elapsedSeconds = (end - start) / 1000;
  const requestsPerSecond = 1 / elapsedSeconds;

  console.info(`Requests per second: ${requestsPerSecond.toFixed(2)}`);
  console.log(`Response: ${JSON.stringify(json, null, 2)}`);
};

const main = async (actionName: string, data: string, numPlayers: string) => {
  if (!Object.keys(schemas).includes(actionName)) {
    throw new Error(
      `Action ${actionName} not found. Available actions: ${Object.keys(
        schemas,
      ).join(", ")}`,
    );
  }

  //   const wallet = walletName === "alice" ? walletOne : walletTwo;
  await run(actionName as ActionName, data, numPlayers);
};

main(process.argv[2], process.argv[3], process.argv[4]);

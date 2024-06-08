import { MicroRollup } from "@stackr/sdk";
import { stackrConfig } from "../stackr.config.ts";

import { schemas } from "./stackr/action.ts";
import { machine } from "./stackr/machine.ts";

const mru = await MicroRollup({
  config: stackrConfig,
  actionSchemas: [...Object.values(schemas)],
  stateMachines: [machine],
});

await mru.init();

export { mru };

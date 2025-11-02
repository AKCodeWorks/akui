import type { AkRegConfig } from "./default-config.js";
import { allowedKeys } from "./default-config.js";
import { ask } from "./ask.js";

async function mergeConfig(defaults: AkRegConfig, custom: AkRegConfig): Promise<AkRegConfig> {
  const invalidKeys = Object.keys(custom).filter((k) => !allowedKeys.includes(k));
  if (invalidKeys.length > 0) {
    console.info(`The following keys in the custom config are not recognized and can be removed from your config: ${invalidKeys.join(", ")}`);
  }
  const missingKeys = Object.keys(defaults).filter((k) => !(k in custom));
  if (missingKeys.length > 0) {
    const proceed = await ask(`The following keys are missing from your custom config and default values will be used: ${missingKeys.join(", ")}. Would you like to proceed using default values for all missing keys?`)
    if (!proceed) {
      throw new Error("Aborted merging config due to missing keys.");
    }
  }
  return { ...defaults, ...custom };
}

export { mergeConfig }
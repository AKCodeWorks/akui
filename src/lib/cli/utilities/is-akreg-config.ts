import type { AkRegConfig } from "./default-config.js";
import { allowedKeys } from "./default-config.js";

/** Type guard for validating the config shape. */
function isAkRegConfig(value: unknown): value is AkRegConfig {
  if (typeof value !== "object" || value === null) return false;
  return Object.keys(value).every((k) => allowedKeys.includes(k));
}

export { isAkRegConfig }
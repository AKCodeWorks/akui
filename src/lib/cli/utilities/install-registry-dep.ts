import { existsSync, readFileSync } from "fs";
import path from "path";
import { ask } from "./ask.js";
import type { AkuiConfig } from "./default-config.js";
import { extractAkuiVersion } from "./extract-akui-version.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function installRegistryDep(depName: string, registry: any, config: AkuiConfig) {
  const entry = registry[depName];
  if (!entry) {
    console.warn(`⚠ Registry dependency "${depName}" not found in registry.`);
    return;
  }

  const targetDir = path.resolve(config.installDir, depName);
  const mainFile = entry.components?.[0]?.file ? path.basename(entry.components[0].file) : null;
  const dest = mainFile ? path.join(targetDir, mainFile) : null;

  let localVersion = "UNTRACKED";
  const remoteVersion = entry.components?.[0]?.version ?? "UNTRACKED";
  let needsInstall = false;

  if (!dest || !existsSync(dest)) {
    needsInstall = true;
  } else {
    const existingContent = readFileSync(dest, "utf8");
    const extracted = extractAkuiVersion(existingContent);
    localVersion = extracted ?? "UNTRACKED";
    needsInstall = localVersion !== remoteVersion;
  }

  if (!needsInstall) {
    console.log(`✔ ${depName} already installed (version ${localVersion})`);
    return;
  }

  const proceed = await ask(
    `Component dependency "${depName}" is ${!dest ? "missing" : "outdated"} (local: ${localVersion}, remote: ${remoteVersion}). Install or update it and its dependencies?`
  );
  if (!proceed) {
    console.log(`✖ Skipped registry dependency "${depName}"`);
    return;
  }

  console.log(`⬇ Installing registry dependency "${depName}"...`);
  const args = [process.argv[1], depName];;
  const { spawnSync } = await import("child_process");
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.error) console.error(`Failed to install registry dependency "${depName}"`, result.error);
}

export { installRegistryDep }
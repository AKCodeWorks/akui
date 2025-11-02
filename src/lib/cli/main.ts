#!/usr/bin/env node
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  ask,
  detectPackageManager,
  extractAkRegVersion,
  getInstalledDeps,
  parseDepString,
  versionSatisfies,
  installRegistryDep,
  getAkRegConfig,
  injectAkRegComment,

} from "./utilities/index.js";

import { mergeConfig } from "./utilities/merge-config.js";
import { defaultConfig, type AkRegConfig, } from "./utilities/default-config.js";


async function main(): Promise<void> {
  const componentKey = process.argv[2];
  if (!componentKey) {
    console.error("No component key provided. Usage: akreg <component-key>");
    process.exit(1);
  }

  const userConfig = await getAkRegConfig();

  let config: AkRegConfig;

  if (!userConfig) {
    const proceed = await ask(
      `\nAn invalid or missing akreg.config file was detected. Would you like to proceed with the default configuration? (You can create a custom akreg.config.js file later to override these settings.)`
    );
    if (!proceed) throw new Error("Aborted due to missing akreg.config file.");
    config = defaultConfig;
  } else {
    config = await mergeConfig(defaultConfig, userConfig);
  }

  const { installDir, registryUrl, registryDir, registryComponentDir } = config;

  const REGISTRY_URL = `${registryUrl}/${registryDir}`;

  console.log(`Fetching registry from: ${REGISTRY_URL}`);

  const res = await fetch(REGISTRY_URL);
  if (!res.ok) {
    console.error(
      "Failed to fetch registry file. Check your network connection and/or make sure your registry url is correct if using a custom config."
    );
    process.exit(1);
  }

  const registry = (await res.json()) as Record<
    string,
    {
      deps?: string[];
      "dev-deps"?: string[];
      registryDeps?: string[];
      components: { file: string; version?: string }[];
    }
  >;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [_, entry] of Object.entries(registry)) {
    entry.components = entry.components.map((c) => ({
      ...c,
      version: c.version !== undefined ? String(c.version) : "UNTRACKED"
    }));
  }

  const entry = registry[componentKey];
  if (!entry) {
    console.error(`Component "${componentKey}" not found in registry.`);
    process.exit(1);
  }


  if (entry.registryDeps && entry.registryDeps.length) {
    console.log("\nChecking registry dependencies...\n");
    for (const depName of entry.registryDeps) {
      await installRegistryDep(depName, registry, config);
    }
  }


  const targetDir = path.resolve(installDir, componentKey);
  mkdirSync(targetDir, { recursive: true });

  const updated: string[] = [];
  const skipped: string[] = [];

  for (const c of entry.components) {
    const rawUrl = `${registryUrl}/${registryComponentDir}/${c.file}`;
    const fileName = path.basename(c.file);
    const dest = path.join(targetDir, fileName);
    const remoteVersion = c.version ?? "UNTRACKED";

    const fileExists = existsSync(dest);
    let localVersion = "UNTRACKED";
    let overwrite = true;

    if (fileExists) {
      const existingContent = readFileSync(dest, "utf8");
      const extracted = extractAkRegVersion(existingContent);
      localVersion = extracted ?? "UNTRACKED";

      if (localVersion === remoteVersion) {
        console.log(`✔ ${fileName} is up to date (version ${localVersion}).`);
        skipped.push(`${fileName} (was already up to date)`);
        continue;
      }

      if (localVersion === "UNTRACKED" || remoteVersion === "UNTRACKED") {
        console.warn(
          `⚠ ${fileName} is UNTRACKED. It will be overwritten if confirmed.`
        );
        overwrite = await ask(`Overwrite untracked file ${fileName}?`);
      } else {
        console.warn(
          `⚠ ${fileName} version mismatch (local ${localVersion}, remote ${remoteVersion}).`
        );
        overwrite = await ask(`Update ${fileName} to version ${remoteVersion}?`);
      }

      if (!overwrite) {
        console.log(`✖ Skipped ${fileName} (user declined overwrite)`);
        skipped.push(`${fileName} (user declined overwrite)`);
        continue;
      }
    }

    console.log(`Fetching ${rawUrl}`);
    const resp = await fetch(rawUrl);
    if (!resp.ok) {
      console.error(`Failed to fetch ${rawUrl}`);
      skipped.push(`${fileName} (fetch failed)`);
      continue;
    }

    let content = await resp.text();
    content = injectAkRegComment(fileName, content, remoteVersion);

    writeFileSync(dest, content, "utf8");
    updated.push(fileName);
    console.log(
      `⬆ Wrote ${fileName}${remoteVersion ? ` (version ${remoteVersion})` : ""}`
    );
  }

  const pkgManager = detectPackageManager();
  const installed = getInstalledDeps();

  const deps = entry.deps || [];
  const devDeps = entry["dev-deps"] || [];

  const depsToInstall: string[] = [];
  const devDepsToInstall: string[] = [];

  if (deps.length || devDeps.length) {
    console.log("\nDependency check:\n");

    for (const dep of deps) {
      const { name, version } = parseDepString(dep);
      const installedVer = installed[name];
      if (installedVer && versionSatisfies(installedVer, version)) {
        console.log(`✔ ${dep} already installed (skipping)`);
      } else {
        console.log(
          installedVer
            ? `⬇ ${dep} required (installed ${installedVer}) → will update`
            : `⬇ ${dep} missing (will install)`
        );
        depsToInstall.push(dep);
      }
    }

    for (const dep of devDeps) {
      const { name, version } = parseDepString(dep);
      const installedVer = installed[name];
      if (installedVer && versionSatisfies(installedVer, version)) {
        console.log(`✔ ${dep} already installed (skipping)`);
      } else {
        console.log(
          installedVer
            ? `⬇ ${dep} required (installed ${installedVer}) → will update`
            : `⬇ ${dep} missing (will install)`
        );
        devDepsToInstall.push(dep);
      }
    }

    const hasDeps = depsToInstall.length > 0;
    const hasDevDeps = devDepsToInstall.length > 0;

    switch (true) {
      case !hasDeps && !hasDevDeps:
        console.log("All dependencies already meet version requirements.");
        break;

      case hasDeps || hasDevDeps: {
        const confirm = await ask(
          `\nInstall or update missing dependencies using ${pkgManager}?`
        );

        if (!confirm) {
          console.log("Skipped dependency installation.");
          break;
        }

        try {
          if (hasDeps)
            execSync(`${pkgManager} add ${depsToInstall.join(" ")}`, {
              stdio: "inherit"
            });

          if (hasDevDeps) {
            const flag = pkgManager === "npm" ? "--save-dev" : "-D";
            execSync(`${pkgManager} add ${flag} ${devDepsToInstall.join(" ")}`, {
              stdio: "inherit"
            });
          }
        } catch {
          console.error("Error installing dependencies.");
        }
        break;
      }

      default:
        console.log("Unknown dependency state.");
        break;
    }
  } else {
    console.log("\nNo dependencies listed in registry entry.");
  }

  console.log("\nSummary:");
  if (updated.length) console.log("⬆ Installed/Updated:", updated.join(", "));
  if (skipped.length) console.log("✔ Skipped:", skipped.join(", "));
  if (!updated.length && !skipped.length) console.log("No component changes.");

  console.log(`\n✅ Component "${componentKey}" installation complete.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
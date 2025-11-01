// dirty but i'll sort out handling imorts and exports of uitlities when i actually publish the cli tool
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import path from "path";
import { execSync } from "child_process";
import readline from "readline";

const BASE_URL =
  "https://raw.githubusercontent.com/AKCodeWorks/akui/refs/heads/main/src/registry";
const REGISTRY_URL = `${BASE_URL}/registry.json`;


function detectPackageManager(): "npm" | "pnpm" | "yarn" | "bun" {
  const cwd = process.cwd();
  switch (true) {
    case existsSync(path.join(cwd, "pnpm-lock.yaml")):
      return "pnpm";
    case existsSync(path.join(cwd, "yarn.lock")):
      return "yarn";
    case existsSync(path.join(cwd, "bun.lockb")):
      return "bun";
    case existsSync(path.join(cwd, "package-lock.json")):
      return "npm";
    default:
      return "npm";
  }
}

function ask(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (ans) => {
      rl.close();
      resolve(/^y(es)?$/i.test(ans.trim()));
    });
  });
}

function getInstalledDeps(): Record<string, string> {
  const pkgPath = path.resolve("package.json");
  if (!existsSync(pkgPath)) return {};
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  return {
    ...pkg.dependencies,
    ...pkg.devDependencies
  };
}

function parseDepString(dep: string): { name: string; version?: string } {
  if (!dep.includes("@") || (dep.startsWith("@") && dep.indexOf("@", 1) === -1)) {
    return { name: dep };
  }
  const atIndex = dep.lastIndexOf("@");
  const name = dep.slice(0, atIndex);
  const version = dep.slice(atIndex + 1);
  return { name, version };
}

function versionSatisfies(installed: string, required?: string): boolean {
  if (!required) return true;
  const clean = (v: string) => v.replace(/[^0-9.]/g, "");
  const [a, b] = [clean(installed), clean(required)];
  if (!a || !b) return false;
  return a.localeCompare(b, undefined, { numeric: true }) >= 0;
}

function extractAkuiVersion(content: string): string | null {
  const regex = /AKUI_VERSION:\s*([\w.]+)/i;
  const match = content.match(regex);
  return match ? match[1] : null;
}

function injectAkuiComment(fileName: string, content: string, version: string): string {
  const header =
    fileName.endsWith(".svelte")
      ? `<!-- AKUI_VERSION: ${version} DO NOT DELETE OR YOUR FILE WILL BE OVERWRITTEN ON UPDATE! -->`
      : `// AKUI_VERSION: ${version} DO NOT DELETE OR YOUR FILE WILL BE OVERWRITTEN ON UPDATE!`;

  const cleaned = content.replace(/^\uFEFF/, "").trimStart();
  return `${header}\n${cleaned}`;
}



async function main(): Promise<void> {
  const componentKey = process.argv[2];
  if (!componentKey) {
    console.error("Usage: tsx get-components.ts <component-key>");
    process.exit(1);
  }

  console.log(`Fetching registry from: ${REGISTRY_URL}`);
  const res = await fetch(REGISTRY_URL);
  if (!res.ok) {
    console.error("Failed to fetch registry file.");
    process.exit(1);
  }

  const registry = (await res.json()) as Record<
    string,
    {
      deps?: string[];
      "dev-deps"?: string[];
      components: { file: string; version?: string }[];
    }
  >;

  const entry = registry[componentKey];
  if (!entry) {
    console.error(`Component "${componentKey}" not found in registry.`);
    process.exit(1);
  }

  const targetDir = path.resolve("src/lib/components/akui", componentKey);
  mkdirSync(targetDir, { recursive: true });

  const updated: string[] = [];
  const skipped: string[] = [];

  for (const c of entry.components) {
    const rawUrl = `${BASE_URL}/${c.file}`;
    const fileName = path.basename(c.file);
    const dest = path.join(targetDir, fileName);
    const remoteVersion = c.version ?? "UNTRACKED";

    const fileExists = existsSync(dest);
    let localVersion = "UNTRACKED";
    let overwrite = true;

    if (fileExists) {
      const existingContent = readFileSync(dest, "utf8");
      const extracted = extractAkuiVersion(existingContent);
      localVersion = extracted ?? "UNTRACKED";

      if (localVersion === remoteVersion) {
        console.log(`✔ ${fileName} is up to date (version ${localVersion}).`);
        skipped.push(fileName);
        continue;
      }

      if (localVersion === "UNTRACKED" || remoteVersion === "UNTRACKED") {
        console.warn(`⚠ ${fileName} is UNTRACKED. It will be overwritten if confirmed.`);
        overwrite = await ask(`Overwrite untracked file ${fileName}?`);
      } else {
        console.warn(
          `⚠ ${fileName} version mismatch (local ${localVersion}, remote ${remoteVersion}).`
        );
        overwrite = await ask(`Update ${fileName} to version ${remoteVersion}?`);
      }

      if (!overwrite) {
        console.log(`✖ Skipped ${fileName}`);
        skipped.push(fileName);
        continue;
      }
    }

    console.log(`Fetching ${rawUrl}`);
    const resp = await fetch(rawUrl);
    if (!resp.ok) {
      console.error(`Failed to fetch ${rawUrl}`);
      continue;
    }

    let content = await resp.text();
    content = injectAkuiComment(fileName, content, remoteVersion);

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
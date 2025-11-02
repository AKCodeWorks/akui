/** The expected structure of an AKREG config file. */
export interface AkRegConfig {
  registryUrl: string;
  registryDir: string;
  installDir: string;
  registryComponentDir: string;

}

const config: AkRegConfig = {
  installDir: "src/lib/components/akreg",
  registryDir: "src/registry/registry.json",
  registryComponentDir: 'src/registry',
  registryUrl: "https://raw.githubusercontent.com/AKCodeWorks/akreg/refs/heads/main"
}

const allowedKeys = Object.keys(config);

export { config as defaultConfig, allowedKeys }
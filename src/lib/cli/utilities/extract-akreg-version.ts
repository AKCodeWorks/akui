function extractAkRegVersion(content: string): string | null {
  const regex = /AKREG_VERSION:\s*([\w.]+)/i;
  const match = content.match(regex);
  return match ? match[1] : null;
}

export { extractAkRegVersion };
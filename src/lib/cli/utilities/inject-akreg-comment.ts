function injectAkRegComment(fileName: string, content: string, version: string): string {
  const header =
    fileName.endsWith(".svelte")
      ? `<!-- AKREG_VERSION: ${version} DO NOT DELETE OR YOUR FILE WILL BE OVERWRITTEN ON UPDATE! -->`
      : `// AKREG_VERSION: ${version} DO NOT DELETE OR YOUR FILE WILL BE OVERWRITTEN ON UPDATE!`;
  const cleaned = content.replace(/^\uFEFF/, "").trimStart();
  return `${header}\n${cleaned}`;
}

export { injectAkRegComment };
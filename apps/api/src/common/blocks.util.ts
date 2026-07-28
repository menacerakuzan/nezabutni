/** Простий текст ↔ Json-блоки, як їх читають /stories/[slug] і /museum/[slug]. */
export function textToBlocks(text: string): { type: "paragraph"; body: string }[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((body) => ({ type: "paragraph" as const, body }));
}

export function blocksToText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .map((b) => (b && typeof b === "object" && "body" in b ? String((b as { body: unknown }).body) : ""))
    .filter(Boolean)
    .join("\n\n");
}

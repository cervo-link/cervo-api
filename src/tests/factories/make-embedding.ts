export function makeRawEmbedding(): number[] {
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
}

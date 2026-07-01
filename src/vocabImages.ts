// Maps a vocab word's `imagePath` (a stable slug, e.g. "taberu") to the
// actual built asset URL. Images live in src/assets/vocab-images/ so Vite's
// asset pipeline content-hashes them and resolves the GitHub Pages base path
// ("/learn-hiragana/") automatically — a plain string path in vocabulary.ts
// would bypass that and 404 in production.
const modules = import.meta.glob("./assets/vocab-images/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const urlsBySlug: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const slug = path.split("/").pop()!.replace(/\.png$/, "");
  urlsBySlug[slug] = url;
}

export function getVocabImageUrl(slug: string): string | undefined {
  return urlsBySlug[slug];
}

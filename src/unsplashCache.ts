export interface UnsplashImage {
  url: string;
  photographer: string;
  photographerUrl: string;
}

function cacheKey(hiragana: string): string {
  return `unsplash-cache:${hiragana}`;
}

export function getCachedImage(hiragana: string): UnsplashImage | null {
  try {
    const raw = localStorage.getItem(cacheKey(hiragana));
    if (!raw) return null;
    return JSON.parse(raw) as UnsplashImage;
  } catch {
    return null;
  }
}

export function setCachedImage(hiragana: string, image: UnsplashImage): void {
  try {
    localStorage.setItem(cacheKey(hiragana), JSON.stringify(image));
  } catch {
    // private mode or quota exceeded — image just won't be cached this session
  }
}

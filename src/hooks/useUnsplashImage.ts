import { useEffect, useState } from "react";
import { getCachedImage, setCachedImage, type UnsplashImage } from "../unsplashCache";

const FETCH_TIMEOUT_MS = 8000;

export type UnsplashStatus = "loading" | "loaded" | "error";

export function useUnsplashImage(hiragana: string, imageQuery: string) {
  const [status, setStatus] = useState<UnsplashStatus>("loading");
  const [image, setImage] = useState<UnsplashImage | null>(null);

  useEffect(() => {
    const cached = getCachedImage(hiragana);
    if (cached) {
      setImage(cached);
      setStatus("loaded");
      return;
    }

    const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined;
    if (!accessKey) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    setImage(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(imageQuery)}&count=1&client_id=${accessKey}`;

    fetch(url, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("unsplash request failed"))))
      .then((data) => {
        const photo = Array.isArray(data) ? data[0] : data;
        if (!photo?.urls?.regular) throw new Error("no photo found");
        const result: UnsplashImage = {
          url: photo.urls.regular,
          photographer: photo.user?.name ?? "Unsplash",
          photographerUrl: photo.user?.links?.html ?? "https://unsplash.com",
        };
        setCachedImage(hiragana, result);
        setImage(result);
        setStatus("loaded");
      })
      .catch(() => {
        setStatus("error");
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [hiragana, imageQuery]);

  return { status, image };
}

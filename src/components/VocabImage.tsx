import { useUnsplashImage } from "../hooks/useUnsplashImage";

interface Props {
  hiragana: string;
  imageQuery: string;
  emojiBackup: string;
  label: string;
}

export default function VocabImage({ hiragana, imageQuery, emojiBackup, label }: Props) {
  const { status, image } = useUnsplashImage(hiragana, imageQuery);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="rounded-2xl overflow-hidden bg-stone-100 flex items-center justify-center">
        {status === "loading" && <div className="w-full h-full animate-pulse bg-stone-200" />}
        {status === "loaded" && image && (
          <img
            src={image.url}
            alt={label}
            className="w-full h-full object-cover"
          />
        )}
        {status === "error" && (
          <span role="img" aria-label={label} className="text-6xl">
            {emojiBackup}
          </span>
        )}
      </div>
      {status === "loaded" && image && (
        <p className="text-[10px] text-stone-400">
          Photo by{" "}
          <a href={image.photographerUrl} target="_blank" rel="noreferrer" className="underline">
            {image.photographer}
          </a>{" "}
          on{" "}
          <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="underline">
            Unsplash
          </a>
        </p>
      )}
    </div>
  );
}

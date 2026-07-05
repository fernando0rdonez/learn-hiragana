export type DetectedOS = "ios" | "android" | "macos" | "windows" | "other";

/**
 * UA-string sniffing is the only option for iOS (Safari never implements
 * userAgentData/Client Hints). iPadOS 13+ reports itself as "MacIntel" like a
 * real Mac, so it's disambiguated via the touch-points trick.
 */
export function detectOS(): DetectedOS {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || isIPadOS) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Win/.test(ua)) return "windows";
  if (/Mac/.test(ua)) return "macos";
  return "other";
}

/**
 * Invite links and QR parsing for competitions ("retos") and shared goals
 * ("metas"). See docs/QR_JOIN_PLAN.md.
 *
 * The QR on the share screens encodes the full invite URL, so a phone's native
 * camera still opens the web link. The in-app scanner runs the decoded text
 * through `parseScannedInvite` to pull the code out and feed the existing
 * join flow.
 */

export type InviteKind = "compete" | "goal";

export interface ScannedInvite {
  kind: InviteKind;
  code: string;
}

/** URL path segment per invite kind — must match the deep-link parsing in App.tsx. */
const PATH_SEGMENT: Record<InviteKind, string> = {
  compete: "compete",
  goal: "meta",
};

const CODE_RE = /^[A-Za-z0-9]{4,32}$/;
// Matches ".../compete/CODE" or ".../meta/CODE" at the end of a path, with an
// optional trailing slash. Also used on the GitHub Pages 404-redirect form,
// where the real path ends up in the query string ("/?/compete/CODE").
const PATH_RE = /(?:^|\/)(compete|meta)\/([A-Za-z0-9]{4,32})\/?$/;

export function inviteUrl(
  kind: InviteKind,
  code: string,
  origin: string = window.location.origin,
  base: string = import.meta.env.BASE_URL,
): string {
  return `${origin}${base}${PATH_SEGMENT[kind]}/${code}`;
}

function fromPath(path: string): ScannedInvite | null {
  const match = path.match(PATH_RE);
  if (!match) return null;
  return {
    kind: match[1] === "meta" ? "goal" : "compete",
    code: match[2].toLowerCase(),
  };
}

/**
 * Extracts an invite from the text inside a scanned QR.
 *
 * Accepts a competition/goal URL (any origin), the 404-redirect form, or a
 * bare code. A bare code has no kind of its own, so it takes `fallbackKind`
 * (the screen the user scanned from). Returns null for anything else.
 */
export function parseScannedInvite(text: string, fallbackKind: InviteKind): ScannedInvite | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (CODE_RE.test(trimmed)) {
    return { kind: fallbackKind, code: trimmed.toLowerCase() };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const fromPathname = fromPath(url.pathname);
  if (fromPathname) return fromPathname;

  // 404-redirect form: "?/compete/CODE" (possibly followed by "&...").
  const redirected = url.search.match(/^\?(\/[^&]*)/);
  return redirected ? fromPath(redirected[1]) : null;
}

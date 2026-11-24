import { test } from "node:test";
import assert from "node:assert/strict";
import { encode } from "uqr";
import jsQR from "jsqr";
import { inviteUrl, parseScannedInvite } from "./qrInvite";

const ORIGIN = "https://fernando0rdonez.github.io";
const BASE = "/learn-hiragana/";

test("parses a competition invite URL", () => {
  assert.deepEqual(
    parseScannedInvite(`${ORIGIN}${BASE}compete/a1b2c3d4`, "goal"),
    { kind: "compete", code: "a1b2c3d4" },
  );
});

test("parses a goal invite URL regardless of the screen it was scanned from", () => {
  assert.deepEqual(
    parseScannedInvite(`${ORIGIN}${BASE}meta/a1b2c3d4`, "compete"),
    { kind: "goal", code: "a1b2c3d4" },
  );
});

test("round-trips inviteUrl for both kinds", () => {
  for (const kind of ["compete", "goal"] as const) {
    const url = inviteUrl(kind, "deadbeef", ORIGIN, BASE);
    assert.deepEqual(parseScannedInvite(url, kind === "goal" ? "compete" : "goal"), { kind, code: "deadbeef" });
  }
});

test("accepts a trailing slash, surrounding whitespace and upper-case codes", () => {
  assert.deepEqual(
    parseScannedInvite(`  ${ORIGIN}${BASE}compete/A1B2C3D4/ \n`, "goal"),
    { kind: "compete", code: "a1b2c3d4" },
  );
});

test("accepts other origins (localhost dev, custom domain)", () => {
  assert.deepEqual(
    parseScannedInvite("http://localhost:5173/learn-hiragana/meta/abcd1234", "compete"),
    { kind: "goal", code: "abcd1234" },
  );
});

test("parses the GitHub Pages 404-redirect form", () => {
  assert.deepEqual(
    parseScannedInvite(`${ORIGIN}${BASE}?/compete/a1b2c3d4`, "goal"),
    { kind: "compete", code: "a1b2c3d4" },
  );
  assert.deepEqual(
    parseScannedInvite(`${ORIGIN}${BASE}?/meta/a1b2c3d4&utm=x`, "compete"),
    { kind: "goal", code: "a1b2c3d4" },
  );
});

test("a bare code takes the fallback kind", () => {
  assert.deepEqual(parseScannedInvite("A1B2C3D4", "goal"), { kind: "goal", code: "a1b2c3d4" });
  assert.deepEqual(parseScannedInvite("a1b2c3d4", "compete"), { kind: "compete", code: "a1b2c3d4" });
});

test("rejects things that are not invites", () => {
  for (const text of [
    "",
    "   ",
    "abc",
    "hello world",
    `${ORIGIN}${BASE}`,
    `${ORIGIN}${BASE}compete/`,
    `${ORIGIN}${BASE}compete/a1b2c3d4/extra`,
    `${ORIGIN}${BASE}other/a1b2c3d4`,
    "javascript:alert(1)//compete/a1b2c3d4",
    "WIFI:S:home;T:WPA;P:secret;;",
  ]) {
    assert.equal(parseScannedInvite(text, "compete"), null, `expected null for ${JSON.stringify(text)}`);
  }
});

test("a QR rendered like InviteQr decodes back to the same invite", () => {
  for (const kind of ["compete", "goal"] as const) {
    const url = inviteUrl(kind, "a1b2c3d4", ORIGIN, BASE);
    // Same options as src/components/InviteQr.tsx.
    const qr = encode(url, { ecc: "M", border: 4 });
    const scale = 6;
    const side = qr.size * scale;
    const pixels = new Uint8ClampedArray(side * side * 4);
    for (let y = 0; y < side; y++) {
      for (let x = 0; x < side; x++) {
        const v = qr.data[Math.floor(y / scale)][Math.floor(x / scale)] ? 0 : 255;
        pixels.set([v, v, v, 255], (y * side + x) * 4);
      }
    }
    const decoded = jsQR(pixels, side, side);
    assert.equal(decoded?.data, url);
    assert.deepEqual(parseScannedInvite(decoded.data, "compete"), { kind, code: "a1b2c3d4" });
  }
});

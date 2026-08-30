import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  factionInk,
  healthInk,
  statusInk,
  ACCENT,
  ALERT,
  GRID_INK,
  DEAD_INK,
} from "../app/Map/factions";

const css = readFileSync(resolve(__dirname, "../index.css"), "utf8");

/** Rec. 709 relative luminance of a #rrggbb colour. */
const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Chroma of a #rrggbb colour, 0 for a pure grey. */
const chroma = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return Math.max(r, g, b) - Math.min(r, g, b);
};

/** Every `--token: H S% L%` declaration in the theme block. */
const tokens = [...css.matchAll(/--([\w-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/g)].map(
  ([, name, , saturation]) => ({ name, saturation: Number(saturation) })
);

/** The interface is allowed exactly one hue, plus a rarely-shown alert. */
const HUED_TOKENS = new Set(["primary", "ring", "destructive"]);

describe("theme tokens", () => {
  it("defines a full set of tokens", () => {
    expect(tokens.length).toBeGreaterThan(12);
  });

  it("keeps every neutral at zero saturation — the ground is true black", () => {
    const tinted = tokens.filter(
      (token) => !HUED_TOKENS.has(token.name) && token.saturation > 0
    );

    expect(tinted).toEqual([]);
  });

  it("starts the ramp at near-black", () => {
    const background = /--background:\s*[\d.]+\s+[\d.]+%\s+([\d.]+)%/.exec(css);

    expect(background).not.toBeNull();
    expect(Number(background![1])).toBeLessThan(6);
  });

  it("carries exactly one accent hue", () => {
    const hues = new Set(
      [...css.matchAll(/--(primary|ring):\s*([\d.]+)\s/g)].map(([, , hue]) => hue)
    );

    expect(hues.size).toBe(1);
  });
});

describe("map palette", () => {
  const neutrals = [...Object.values(factionInk), GRID_INK, DEAD_INK];

  it("draws identity in pure greys, leaving hue to mean something", () => {
    for (const ink of neutrals) {
      expect(chroma(ink)).toBe(0);
    }
  });

  it("draws condition in green, so a ring reads as health", () => {
    for (const ink of Object.values(healthInk)) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(ink.slice(i, i + 2), 16));

      expect(g).toBeGreaterThan(r);
      expect(g).toBeGreaterThan(b);
    }
  });

  it("keeps condition clear of the accent, so contact still stands out", () => {
    // Same hue family, so they must separate on luminance instead.
    expect(luminance(healthInk.healthy)).toBeGreaterThan(luminance(ACCENT));
    expect(luminance(healthInk.wounded)).toBeLessThan(luminance(ACCENT));
  });

  it("spends hue on exactly two things: contact, and a man going down", () => {
    // Everything else on the map is grey. These two are allowed a colour
    // because they are the states a half-watching reader has to catch.
    const hued = new Set(
      Object.values(statusInk).filter((ink) => chroma(ink) > 0)
    );

    expect([...hued].sort()).toEqual([ACCENT, ALERT].sort());
  });

  it("keeps the alarm colour clear of the accent", () => {
    const hue = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      return { r, g, b };
    };
    const accent = hue(ACCENT);
    const alert = hue(ALERT);

    // Contact reads green, a casualty reads red — they must not be confusable.
    expect(accent.g).toBeGreaterThan(accent.r);
    expect(alert.r).toBeGreaterThan(alert.g);
  });

  it("makes friendly units read brighter than hostile ones", () => {
    expect(luminance(factionInk.usec)).toBeGreaterThan(
      luminance(factionInk.bear)
    );
  });

  it("orders condition inks from bright to dim", () => {
    const ordered = [
      healthInk.healthy,
      healthInk.wounded,
      healthInk.critical,
      healthInk.kia,
    ].map(luminance);

    for (let i = 1; i < ordered.length; i += 1) {
      expect(ordered[i]).toBeLessThan(ordered[i - 1]);
    }
  });
});

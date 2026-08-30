import { describe, it, expect } from "vitest";
import {
  PlatoonFaction,
  Role,
  UnitStatusType,
  UnitType,
  CoverType,
  WeaponType,
  SightType,
  defaultInventory,
  defaultBodyParts,
  vitalsFor,
} from "shared";
import { unitIcon } from "../app/Map/unitIcon";
import {
  ACCENT,
  KIA_INK,
  factionInk,
  healthInk,
  UNIT_MAX_HEALTH,
} from "../app/Map/factions";

const makeUnit = (overrides: Partial<UnitType> = {}): UnitType => ({
  id: "unit1",
  callsign: null,
  mos: null,
  attributes: { marksmanship: 5, composure: 5, fitness: 5, awareness: 5, medicine: 5, leadership: 5 },
  position: [57.1, 26.8],
  destination: null,
  speedMetersPerSecond: 1.5,
  activeWeapon: "primary",
  magazine: 30,
  reloadRemaining: 0,
  bloodVolume: 1,
  bleeds: [],
  vitals: vitalsFor(1),
  incapacitated: false,
  damageTaken: [],
  killedBy: null,
  kills: [],
  assists: [],
  suppression: 0,
  morale: 1,
  moraleState: "steady",
  health: UNIT_MAX_HEALTH,
  healthStatus: "healthy",
  status: UnitStatusType.Idle,
  cover: CoverType.None,
  role: Role.Rifleman,
  inventory: structuredClone(defaultInventory[Role.Rifleman]),
  bodyParts: structuredClone(defaultBodyParts),
  primaryWeapon: WeaponType.AssaultRifle,
  secondaryWeapon: WeaponType.Pistol,
  primaryWeaponSight: SightType.IronSights,
  secondaryWeaponSight: SightType.IronSights,
  ...overrides,
});

const html = (unit: UnitType, faction = PlatoonFaction.USEC, selected = false) =>
  unitIcon(unit, faction, selected).options.html as string;

describe("unit marker anatomy", () => {
  it("produces SVG markup, not an empty or broken icon", () => {
    const markup = html(makeUnit());

    expect(markup).toContain("<svg");
    expect(markup).toContain("</svg>");
    expect(markup.length).toBeGreaterThan(200);
  });

  it("renders the role glyph", () => {
    // The glyphs are traced paths; if the SVGR import or the nested-svg
    // placement broke, there would be no path data at all.
    const markup = html(makeUnit({ role: Role.LightMachineGunner }));

    expect(markup).toContain("<path");
    expect(markup).toContain("currentColor");
  });

  it("gives each role a visually different glyph", () => {
    expect(html(makeUnit({ id: "a", role: Role.Rifleman }))).not.toEqual(
      html(makeUnit({ id: "b", role: Role.Recon }))
    );
  });

  it("carries no frame around the glyph", () => {
    const markup =
      html(makeUnit(), PlatoonFaction.USEC) +
      html(makeUnit({ id: "z" }), PlatoonFaction.BEAR);

    // The diamond / rounded-rect frame is gone: nothing is rotated any more.
    expect(markup).not.toContain("rotate(45");
  });
});

describe("condition ring", () => {
  it("draws condition in green, ranked by luminance", () => {
    expect(html(makeUnit({ healthStatus: "healthy" }))).toContain(
      healthInk.healthy
    );
    expect(
      html(makeUnit({ id: "b", health: 90, healthStatus: "critical" }))
    ).toContain(healthInk.critical);

    const luminance = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    expect(luminance(healthInk.healthy)).toBeGreaterThan(
      luminance(healthInk.critical)
    );
  });

  it("shortens the arc as health drops", () => {
    const full = html(makeUnit({ id: "full", health: UNIT_MAX_HEALTH }));
    const half = html(makeUnit({ id: "half", health: UNIT_MAX_HEALTH / 2 }));

    // A full ring closes with two arcs; a partial one is a single sweep.
    expect((full.match(/A 18 18/g) ?? []).length).toBe(2);
    expect((half.match(/A 18 18/g) ?? []).length).toBe(1);
  });

  it("crosses to the long sweep only past the halfway point", () => {
    expect(html(makeUnit({ id: "lo", health: 20 }))).toContain("A 18 18 0 0 1");
    expect(
      html(makeUnit({ id: "hi", health: UNIT_MAX_HEALTH * 0.9 }))
    ).toContain("A 18 18 0 1 1");
  });
});

describe("magazine ring", () => {
  it("shortens as rounds are spent", () => {
    const full = html(makeUnit({ id: "full", magazine: 30 }));
    const low = html(makeUnit({ id: "low", magazine: 4 }));

    expect((full.match(/A 13.5 13.5/g) ?? []).length).toBe(2);
    expect((low.match(/A 13.5 13.5/g) ?? []).length).toBe(1);
    expect(low).toContain("A 13.5 13.5 0 0 1");
  });

  it("is sized against the weapon actually in hand", () => {
    // 15 pistol rounds is a full sidearm magazine but half a rifle magazine,
    // so the same count must not draw the same ring.
    const rifle = html(
      makeUnit({ id: "w", activeWeapon: "primary", magazine: 15 })
    );
    const pistol = html(
      makeUnit({ id: "w", activeWeapon: "secondary", magazine: 15 })
    );

    expect(rifle).not.toEqual(pistol);
  });

  it("shows a dashed accent ring while reloading, and no arc", () => {
    const loaded = html(makeUnit({ id: "r", reloadRemaining: 0 }));
    const reloading = html(
      makeUnit({ id: "r", magazine: 0, reloadRemaining: 1.5 })
    );

    expect(reloading).not.toEqual(loaded);
    expect(reloading).toContain(ACCENT);
    expect(reloading).toContain('stroke-dasharray="2 3"');
    expect(reloading).not.toContain("A 13.5 13.5");
  });
});

describe("status and weapon pips", () => {
  it("shows the status pip in the accent only when in contact", () => {
    expect(html(makeUnit({ id: "e", status: UnitStatusType.Engaged }))).toContain(
      ACCENT
    );
    expect(
      html(makeUnit({ id: "i", status: UnitStatusType.Idle }))
    ).not.toContain(ACCENT);
  });

  it("distinguishes moving from idle", () => {
    expect(html(makeUnit({ id: "m", status: UnitStatusType.Moving }))).not.toEqual(
      html(makeUnit({ id: "m", status: UnitStatusType.Idle }))
    );
  });

  it("flags a unit that is down to its sidearm", () => {
    const primary = html(makeUnit({ id: "p", activeWeapon: "primary" }));
    const secondary = html(makeUnit({ id: "p", activeWeapon: "secondary" }));

    // Two pips on the sidearm, one on the primary.
    expect((primary.match(/<rect/g) ?? []).length).toBe(1);
    expect((secondary.match(/<rect/g) ?? []).length).toBe(2);
  });
});

describe("faction identity", () => {
  it("tells the sides apart by ring style, not by hue", () => {
    const usec = html(makeUnit(), PlatoonFaction.USEC);
    const bear = html(makeUnit(), PlatoonFaction.BEAR);

    // Hostile condition rings are segmented; friendly rings are drawn solid.
    expect(bear).toContain('stroke-dasharray="3.5 2.5"');
    expect(usec).not.toContain('stroke-dasharray="3.5 2.5"');
  });

  it("draws friendly units brighter than hostile ones", () => {
    expect(html(makeUnit(), PlatoonFaction.USEC)).toContain(
      factionInk[PlatoonFaction.USEC]
    );
    expect(html(makeUnit(), PlatoonFaction.BEAR)).toContain(
      factionInk[PlatoonFaction.BEAR]
    );
  });

  it("spends hue only on condition and contact, never on identity", () => {
    const markup =
      html(makeUnit(), PlatoonFaction.USEC) +
      html(makeUnit({ id: "z" }), PlatoonFaction.BEAR);

    const hexes = markup.match(/#[0-9A-Fa-f]{6}/g) ?? [];
    const saturated = hexes.filter((hex) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      return Math.max(r, g, b) - Math.min(r, g, b) > 24;
    });

    // Condition rings are green, the accent marks live state, and a casualty's
    // cross is red. Anything else with a hue means colour has leaked back into
    // the chrome.
    const allowed = new Set(
      [ACCENT, KIA_INK, ...Object.values(healthInk)].map((hex) =>
        hex.toUpperCase()
      )
    );

    expect(saturated.length).toBeGreaterThan(0);
    for (const hex of saturated) {
      expect(allowed).toContain(hex.toUpperCase());
    }
  });
});

describe("casualties", () => {
  it("marks a KIA unit with a cross and drops both rings and pips", () => {
    const markup = html(
      makeUnit({
        id: "dead",
        health: 0,
        healthStatus: "kia",
        status: UnitStatusType.Kia,
      })
    );

    expect(markup).toContain("<line");
    expect(markup).not.toContain("A 18 18");
    expect(markup).not.toContain("A 13.5 13.5");
    expect(markup).not.toContain("<rect");
  });

  it("draws the cross in red, matching a kill in the engagement feed", () => {
    const markup = html(
      makeUnit({
        id: "dead2",
        health: 0,
        healthStatus: "kia",
        status: UnitStatusType.Kia,
      })
    );

    expect(markup).toContain(KIA_INK);
  });

  it("fades the badge without fading the cross", () => {
    const markup = html(
      makeUnit({
        id: "dead3",
        health: 0,
        healthStatus: "kia",
        status: UnitStatusType.Kia,
      })
    );

    // The fade lives on an inner group, so the cross that follows it stays at
    // full strength rather than being dimmed along with the rest of the badge.
    const faded = /<g opacity="0.45">/.exec(markup);
    expect(faded).not.toBeNull();
    expect(markup.indexOf(KIA_INK)).toBeGreaterThan(faded!.index);
  });

  it("leaves a living unit's badge at full strength", () => {
    expect(html(makeUnit({ id: "alive" }))).not.toContain('opacity="0.45"');
  });
});

describe("icon caching", () => {
  it("adds a selection ring only when selected", () => {
    const plain = html(makeUnit({ id: "p" }), PlatoonFaction.USEC, false);
    const chosen = html(makeUnit({ id: "p" }), PlatoonFaction.USEC, true);

    expect(chosen.length).toBeGreaterThan(plain.length);
    expect(chosen).toContain(ACCENT);
  });

  it("caches icons so a redraw at 5 Hz does not rebuild markup", () => {
    const unit = makeUnit({ id: "cached" });

    expect(unitIcon(unit, PlatoonFaction.USEC, false)).toBe(
      unitIcon(unit, PlatoonFaction.USEC, false)
    );
  });

  it("strips the default divIcon chrome", () => {
    expect(
      unitIcon(makeUnit(), PlatoonFaction.USEC, false).options.className
    ).toBe("unit-marker");
  });
});

describe("heading chevron", () => {
  const rotation = (markup: string) =>
    /rotate\((-?[\d.]+) /.exec(markup)?.[1];

  it("is absent while the unit has nowhere to be", () => {
    expect(html(makeUnit({ destination: null }))).not.toContain("rotate(");
  });

  it("appears once the unit has somewhere to walk to", () => {
    const moving = html(
      makeUnit({ id: "m", position: [57.1, 26.8], destination: [57.2, 26.8] })
    );

    expect(moving).toContain("rotate(");
    expect(moving).toContain(ACCENT);
  });

  it("points north for a destination due north, east for one due east", () => {
    const north = html(
      makeUnit({ id: "n", position: [57.1, 26.8], destination: [57.2, 26.8] })
    );
    const east = html(
      makeUnit({ id: "e", position: [57.1, 26.8], destination: [57.1, 27.0] })
    );

    expect(Number(rotation(north))).toBeCloseTo(0, 0);
    expect(Number(rotation(east))).toBeCloseTo(90, 0);
  });

  it("points back the other way for a destination due south", () => {
    const south = html(
      makeUnit({ id: "s", position: [57.1, 26.8], destination: [57.0, 26.8] })
    );

    expect(Math.abs(Number(rotation(south)))).toBeCloseTo(180, 0);
  });

  it("is dropped when the unit is killed mid-move", () => {
    const dead = html(
      makeUnit({
        id: "d",
        position: [57.1, 26.8],
        destination: [57.2, 26.8],
        status: UnitStatusType.Kia,
        healthStatus: "kia",
        health: 0,
      })
    );

    expect(dead).not.toContain("rotate(");
  });

  it("keys the cache on heading, so a turn redraws but a nudge does not", () => {
    const west = makeUnit({ id: "t", position: [57.1, 26.8], destination: [57.1, 26.0] });
    const north = { ...west, destination: [57.9, 26.8] as [number, number] };

    expect(unitIcon(west, PlatoonFaction.USEC, false)).not.toBe(
      unitIcon(north, PlatoonFaction.USEC, false)
    );
    expect(unitIcon(west, PlatoonFaction.USEC, false)).toBe(
      unitIcon(west, PlatoonFaction.USEC, false)
    );
  });
});

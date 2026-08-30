import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import {
  GameStatus,
  PlatoonFaction,
  PlatoonStrategy,
  Role,
  UnitStatusType,
  CoverType,
  WeaponType,
  SightType,
  PlatoonType,
  defaultInventory,
  defaultBodyParts,
  vitalsFor,
} from "shared";

import gameReducer, { setGameStatus } from "../redux/slices/game/game";
import uiReducer, { focusUnit, setSelectedUnit } from "../redux/slices/ui/ui";
import platoonsReducer, {
  setPlatoons,
  setFaction,
  setSelectedPlatoon,
  selectSelectedPlatoon,
} from "../redux/slices/platoons/platoons";
import lobbyReducer from "../redux/slices/lobby/lobby";
import GameControls from "../app/containers/GameControls";
import PlatoonPanel from "../app/containers/PlatoonPanel";

const makeUnit = (id: string, role: Role, health = 420) => ({
  id,
  callsign: null,
  mos: null,
  attributes: { marksmanship: 5, composure: 5, fitness: 5, awareness: 5, medicine: 5, leadership: 5 },
  position: [57.1, 26.8] as [number, number],
  destination: null,
  speedMetersPerSecond: 1.5,
  activeWeapon: "primary" as const,
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
  moraleState: "steady" as const,
  health,
  healthStatus: (health > 0 ? "healthy" : "kia") as "healthy" | "kia",
  status: health > 0 ? UnitStatusType.Idle : UnitStatusType.Kia,
  cover: CoverType.None,
  role,
  inventory: structuredClone(defaultInventory[role]),
  bodyParts: structuredClone(defaultBodyParts),
  primaryWeapon: WeaponType.AssaultRifle,
  secondaryWeapon: WeaponType.Pistol,
  primaryWeaponSight: SightType.IronSights,
  secondaryWeaponSight: SightType.IronSights,
});

const platoons: PlatoonType[] = [
  {
    id: "usec-1",
    faction: PlatoonFaction.USEC,
    strategy: PlatoonStrategy.PATROL,
    units: [
      makeUnit("unit1", Role.SquadLeader),
      makeUnit("unit2", Role.Rifleman, 0),
    ],
  },
  {
    id: "bear-1",
    faction: PlatoonFaction.BEAR,
    strategy: PlatoonStrategy.AGGRESSIVE,
    units: [makeUnit("unit6", Role.Recon)],
  },
];

const makeStore = () =>
  configureStore({
    reducer: {
      game: gameReducer,
      platoons: platoonsReducer,
      ui: uiReducer,
      lobby: lobbyReducer,
    },
  });

const renderWithProviders = (
  ui: React.ReactElement,
  store: ReturnType<typeof makeStore>
) =>
  render(<Provider store={store}>{ui}</Provider>);

describe("game slice", () => {
  it("takes status and tick from a broadcast", () => {
    const store = makeStore();
    store.dispatch(setGameStatus({ status: GameStatus.RUNNING, tick: 128 }));

    expect(store.getState().game.status).toBe(GameStatus.RUNNING);
    expect(store.getState().game.tick).toBe(128);
  });
});

describe("platoon selection tracks live state", () => {
  it("resolves the selected platoon against the latest broadcast", () => {
    const store = makeStore();
    store.dispatch(setPlatoons(platoons));
    store.dispatch(setFaction(PlatoonFaction.USEC));

    expect(selectSelectedPlatoon(store.getState())?.id).toBe("usec-1");

    // Regression: selection used to store a copy, so it froze at this point.
    const damaged = structuredClone(platoons);
    damaged[0].units[0].health = 12;
    store.dispatch(setPlatoons(damaged));

    expect(selectSelectedPlatoon(store.getState())?.units[0].health).toBe(12);
  });

  it("drops a selection that no longer exists", () => {
    const store = makeStore();
    store.dispatch(setPlatoons(platoons));
    store.dispatch(setSelectedPlatoon("usec-1"));
    store.dispatch(setPlatoons([platoons[1]]));

    expect(selectSelectedPlatoon(store.getState())).toBeNull();
  });
});

describe("GameControls", () => {
  it("renders the simulation controls against the real theme", () => {
    const store = makeStore();
    renderWithProviders(<GameControls />, store);

    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("disables Pause until the loop is running, then swaps which is live", () => {
    const store = makeStore();
    renderWithProviders(<GameControls />, store);

    expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();

    act(() => {
      store.dispatch(setGameStatus({ status: GameStatus.RUNNING, tick: 4 }));
    });

    expect(screen.getByRole("button", { name: "Pause" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
  });

  it("shows the tick count from the broadcast", () => {
    const store = makeStore();
    renderWithProviders(<GameControls />, store);
    act(() => {
      store.dispatch(setGameStatus({ status: GameStatus.RUNNING, tick: 1234 }));
    });

    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("counts effective strength per faction, excluding KIA", () => {
    const store = makeStore();
    store.dispatch(setPlatoons(platoons));
    renderWithProviders(<GameControls />, store);

    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("1/1")).toBeInTheDocument();
  });
});

describe("engagement feed", () => {
  it("says so when there has been no contact", () => {
    const store = makeStore();
    renderWithProviders(<GameControls />, store);

    expect(screen.getByText("No contact.")).toBeInTheDocument();
  });

  it("lists engagements from the broadcast, newest first", () => {
    const store = makeStore();
    renderWithProviders(<GameControls />, store);

    act(() => {
      store.dispatch(
        setGameStatus({
          status: GameStatus.RUNNING,
          tick: 12,
          events: [
            { type: "hit", message: "unit1 hit unit6 for 30 at 180 m", tick: 10 },
            { type: "kia", message: "unit1 (usec-1) killed unit6", tick: 12 },
          ],
        })
      );
    });

    expect(screen.queryByText("No contact.")).not.toBeInTheDocument();
    expect(
      screen.getByText(/unit1 hit unit6 for 30 at 180 m/)
    ).toBeInTheDocument();
    expect(screen.getByText(/killed unit6/)).toBeInTheDocument();
  });

  it("marks a kill with the alert treatment, not just another grey row", () => {
    const store = makeStore();
    const { container } = renderWithProviders(<GameControls />, store);

    act(() => {
      store.dispatch(
        setGameStatus({
          status: GameStatus.RUNNING,
          tick: 12,
          events: [
            { type: "hit", message: "unit1 hit unit6 for 30 at 180 m", tick: 10 },
            { type: "kia", message: "unit1 (usec-1) killed unit6", tick: 12 },
          ],
        })
      );
    });

    const kia = container.querySelector('[data-kind="kia"]');
    const hit = container.querySelector('[data-kind="hit"]');

    expect(kia).not.toBeNull();
    expect(hit).not.toBeNull();

    // The kill carries the destructive border and a skull; the hit carries
    // neither, so the two cannot be confused at a glance.
    expect(kia!.className).toContain("border-l-destructive");
    expect(hit!.className).not.toContain("border-l-destructive");
    expect(kia!.querySelector("svg")).not.toBeNull();
    expect(hit!.querySelector("svg")).toBeNull();
  });

  it("keeps existing events when a broadcast omits them", () => {
    const store = makeStore();
    store.dispatch(
      setGameStatus({
        status: GameStatus.RUNNING,
        tick: 4,
        events: [{ type: "kia", message: "unit2 killed unit7", tick: 4 }],
      })
    );
    store.dispatch(setGameStatus({ status: GameStatus.PAUSED, tick: 5 }));

    expect(store.getState().game.events).toHaveLength(1);
  });
});

describe("PlatoonPanel", () => {
  it("prompts when nothing is selected", () => {
    const store = makeStore();
    renderWithProviders(<PlatoonPanel />, store);

    expect(screen.getByText("No element on the ground.")).toBeInTheDocument();
  });

  it("lists the selected platoon's units with live health", () => {
    const store = makeStore();
    store.dispatch(setPlatoons(platoons));
    store.dispatch(setSelectedPlatoon("usec-1"));
    renderWithProviders(<PlatoonPanel />, store);

    expect(screen.getByText("USEC-1")).toBeInTheDocument();
    expect(screen.getByText("SQUAD LEADER")).toBeInTheDocument();
  });
});

describe("focusing a unit from the roster", () => {
  it("selects the unit and asks the map to re-centre", () => {
    const store = makeStore();
    const before = store.getState().ui.focusNonce;

    store.dispatch(focusUnit("unit1"));

    expect(store.getState().ui.selectedUnitId).toBe("unit1");
    expect(store.getState().ui.focusNonce).toBe(before + 1);
  });

  it("re-centres again when the same unit is picked twice", () => {
    const store = makeStore();
    store.dispatch(focusUnit("unit1"));
    const first = store.getState().ui.focusNonce;
    store.dispatch(focusUnit("unit1"));

    // The id alone is unchanged, so only the counter can carry the request.
    expect(store.getState().ui.selectedUnitId).toBe("unit1");
    expect(store.getState().ui.focusNonce).toBe(first + 1);
  });

  it("highlights a unit without panning when the map made the selection", () => {
    const store = makeStore();
    const before = store.getState().ui.focusNonce;

    store.dispatch(setSelectedUnit("unit2"));

    expect(store.getState().ui.selectedUnitId).toBe("unit2");
    expect(store.getState().ui.focusNonce).toBe(before);
  });

  it("clicking a roster row focuses that unit", async () => {
    const store = makeStore();
    store.dispatch(setPlatoons(platoons));
    store.dispatch(setSelectedPlatoon("usec-1"));
    renderWithProviders(<PlatoonPanel />, store);

    const row = screen.getByRole("button", { name: /SQUAD LEADER/ });
    act(() => {
      row.click();
    });

    expect(store.getState().ui.selectedUnitId).toBe("unit1");
    expect(store.getState().ui.focusNonce).toBeGreaterThan(0);
  });

  it("keeps a casualty's row clickable, so its last position can be found", () => {
    const store = makeStore();
    store.dispatch(setPlatoons(platoons));
    store.dispatch(setSelectedPlatoon("usec-1"));
    renderWithProviders(<PlatoonPanel />, store);

    const row = screen.getByRole("button", { name: /RIFLEMAN/ });
    expect(row).toBeEnabled();

    act(() => {
      row.click();
    });

    expect(store.getState().ui.selectedUnitId).toBe("unit2");
  });
});

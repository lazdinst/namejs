import { Platoon } from "../types/game";

export const initialPlatoons: Platoon[] = [
  {
    id: "platoon1",
    strategy: "defensive",
    units: [
      { id: "unit1", position: [57.1, 26.8], health: 100, status: "idle" },
      { id: "unit2", position: [57.2, 26.9], health: 100, status: "idle" },
    ],
  },
  {
    id: "platoon2",
    strategy: "aggressive",
    units: [
      { id: "unit3", position: [57.3, 27.0], health: 100, status: "idle" },
      { id: "unit4", position: [57.4, 27.1], health: 100, status: "idle" },
    ],
  },
];

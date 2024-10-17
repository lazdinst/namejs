import { Platoon } from "./Platoon";
import { Unit } from "./Unit";

export const initialPlatoons = (): Platoon[] => {
  return [
    new Platoon("platoon1", "defensive", [
      new Unit("unit1", [57.1, 26.8]),
      new Unit("unit2", [57.2, 26.9]),
    ]),
    new Platoon("platoon2", "aggressive", [
      new Unit("unit3", [57.3, 27.0]),
      new Unit("unit4", [57.4, 27.1]),
    ]),
  ];
};

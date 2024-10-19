import { Platoon } from "../game/Platoon";
import { Unit } from "../game/Unit";
import { Role } from "../types/unit";

export const createUnitByRole = (
  id: string,
  role: Role,
  position: [number, number]
): Unit => {
  return new Unit(id, position, role);
};

export const initialPlatoons = (): Platoon[] => {
  return [
    new Platoon("usec", "defensive", [
      createUnitByRole("unit1", Role.SquadLeader, [57.1, 26.8]),
      createUnitByRole("unit2", Role.Rifleman, [57.2, 26.9]),
      createUnitByRole("unit3", Role.LightMachineGunner, [57.3, 27.0]),
      createUnitByRole("unit4", Role.Grenadier, [57.4, 27.1]),
      createUnitByRole("unit5", Role.Recon, [57.5, 27.2]),
    ]),
    new Platoon("bear", "aggressive", [
      createUnitByRole("unit6", Role.SquadLeader, [57.6, 27.3]),
      createUnitByRole("unit7", Role.Rifleman, [57.7, 27.4]),
      createUnitByRole("unit8", Role.LightMachineGunner, [57.8, 27.5]),
      createUnitByRole("unit9", Role.Grenadier, [57.9, 27.6]),
      createUnitByRole("unit10", Role.Recon, [58.0, 27.7]),
    ]),
  ];
};

import { Unit } from "./Unit";

export class Platoon {
  public id: string;
  public strategy: "aggressive" | "defensive" | "patrol";
  public units: Unit[];

  constructor(
    id: string,
    strategy: "aggressive" | "defensive" | "patrol",
    units: Unit[]
  ) {
    this.id = id;
    this.strategy = strategy;
    this.units = units;
  }

  public attackPlatoon(targetPlatoon: Platoon): string {
    const targetMap = this.assignTargets(targetPlatoon);

    targetMap.forEach((target, attacker) => {
      const attackResult = attacker.attack(target);
      console.log(`${attacker.id} attacked ${target.id}: ${attackResult}`);
    });

    return `Platoon ${this.id} has attacked platoon ${targetPlatoon.id}`;
  }

  private assignTargets(targetPlatoon: Platoon): Map<Unit, Unit> {
    const targetMap = new Map<Unit, Unit>();
    const availableTargets = [...targetPlatoon.units];

    this.units.forEach((attacker) => {
      if (availableTargets.length > 0) {
        // Select a random target from the opposing platoon
        const randomIndex = Math.floor(Math.random() * availableTargets.length);
        const target = availableTargets[randomIndex];
        targetMap.set(attacker, target);

        // Remove the selected target from available targets to avoid duplicate assignments
        availableTargets.splice(randomIndex, 1);
      }
    });

    return targetMap;
  }
}

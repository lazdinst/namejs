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

  public attack(targetPlatoon: Platoon): string {
    const attackSuccessProbability = Math.random();

    if (attackSuccessProbability > 0.5) {
      // If attack is successful, inflict damage to target units
      const damage = Math.floor(Math.random() * 30) + 10; // Random damage between 10 and 40
      targetPlatoon.units.forEach((unit) => {
        unit.takeDamage(damage);
      });

      return `Attack successful! ${targetPlatoon.id} units took ${damage} damage.`;
    } else {
      return "Attack failed.";
    }
  }
}

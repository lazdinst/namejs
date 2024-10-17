export class Unit {
  public id: string;
  public position: [number, number];
  public health: number;
  public status: "idle" | "engaged" | "moving";

  constructor(id: string, position: [number, number]) {
    this.id = id;
    this.position = position;
    this.health = 100;
    this.status = "idle";
  }

  // Method to apply damage to the unit
  public takeDamage(damage: number): void {
    this.health = Math.max(0, this.health - damage);
    if (this.health === 0) {
      this.status = "idle"; // Unit is effectively dead/inactive
    }
  }

  // Method to move the unit
  public move(newPosition: [number, number]): void {
    this.position = newPosition;
    this.status = "moving";
  }
}

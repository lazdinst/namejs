import {
  Role,
  WeaponType,
  InventoryType,
  BodyPart,
  UnitStatusType,
  CoverType,
  defaultInventory,
  defaultBodyParts,
  defaultWeapons,
} from "../types/unit";

export class Unit {
  public id: string;
  public position: [number, number];
  public health: number;
  public status: UnitStatusType;
  public cover: CoverType;
  public role: Role;
  public inventory: InventoryType;
  public bodyParts: BodyPart[];
  public primaryWeapon: WeaponType;
  public secondaryWeapon: WeaponType;
  public primaryWeaponSight: string;
  public secondaryWeaponSight: string;

  constructor(id: string, position: [number, number], role: Role) {
    this.id = id;
    this.position = position;
    this.health = 420;
    this.status = UnitStatusType.Idle;
    this.cover = CoverType.None;
    this.role = role;
    this.inventory = defaultInventory[role];
    this.bodyParts = [...defaultBodyParts];

    const {
      primaryWeapon,
      secondaryWeapon,
      primaryWeaponSight,
      secondaryWeaponSight,
    } = defaultWeapons[role];
    this.primaryWeapon = primaryWeapon;
    this.secondaryWeapon = secondaryWeapon;
    this.primaryWeaponSight = primaryWeaponSight;
    this.secondaryWeaponSight = secondaryWeaponSight;
  }

  public takeDamage(damage: number): void {
    this.health = Math.max(0, this.health - damage);
    if (this.health === 0) {
      this.status = UnitStatusType.Kia;
    }
  }

  public move(newPosition: [number, number]): void {
    this.position = newPosition;
    this.status = UnitStatusType.Moving;
  }

  public attack(target: Unit): string {
    const damage = this.calculateDamage(target);
    target.takeDamage(damage);

    return `Dealt ${damage} damage to ${target.id}`;
  }

  private calculateDamage(target: Unit): number {
    const distance = this.calculateDistance(target);
    const damage = 100 - distance;
    return Math.max(0, damage);
  }

  private calculateDistance(target: Unit): number {
    const [x1, y1] = this.position;
    const [x2, y2] = target.position;
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }
}

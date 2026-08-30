import {
  Coordinate,
  PlatoonFaction,
  FlightType,
  distanceMeters,
  moveTowards,
  HELICOPTER_SPEED_MPS,
  LANDING_RADIUS_METERS,
  insertionOrigin,
} from "shared";
import { Platoon } from "./Platoon";

/**
 * An element in the air. Holds the platoon it will become so that nothing is
 * on the ground — and nothing can be shot — until the helicopter is down.
 */
export class Flight implements FlightType {
  public id: string;
  public platoonId: string;
  public faction: PlatoonFaction;
  public callsign: string;
  public position: Coordinate;
  public origin: Coordinate;
  public landingZoneId: string;
  public destination: Coordinate;
  public remainingMeters: number;
  public aboard: number;
  public status: "inbound" | "landing" = "inbound";

  /** Not part of the wire shape — the men aboard. */
  public readonly cargo: Platoon;

  constructor(
    id: string,
    cargo: Platoon,
    landingZoneId: string,
    destination: Coordinate
  ) {
    this.id = id;
    this.cargo = cargo;
    this.platoonId = cargo.id;
    this.faction = cargo.faction;
    this.callsign = `DUSTOFF ${id.slice(-2).toUpperCase()}`;
    this.landingZoneId = landingZoneId;
    this.destination = [destination[0], destination[1]];
    this.origin = insertionOrigin(cargo.faction, destination);
    this.position = [this.origin[0], this.origin[1]];
    this.remainingMeters = distanceMeters(this.position, this.destination);
    this.aboard = cargo.units.length;
  }

  /** Fly for `seconds`. Returns true on the tick the skids touch down. */
  public advance(seconds: number): boolean {
    const step = HELICOPTER_SPEED_MPS * seconds;
    this.position = moveTowards(this.position, this.destination, step);
    this.remainingMeters = distanceMeters(this.position, this.destination);
    this.status =
      this.remainingMeters <= LANDING_RADIUS_METERS ? "landing" : "inbound";

    return this.remainingMeters <= 1;
  }

  /** What crosses the wire. */
  public toJSON(): FlightType {
    return {
      id: this.id,
      platoonId: this.platoonId,
      faction: this.faction,
      callsign: this.callsign,
      position: this.position,
      origin: this.origin,
      landingZoneId: this.landingZoneId,
      destination: this.destination,
      remainingMeters: this.remainingMeters,
      aboard: this.aboard,
      status: this.status,
    };
  }
}

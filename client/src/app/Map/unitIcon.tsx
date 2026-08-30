import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import {
  PlatoonFaction,
  UnitStatusType,
  UnitType,
  initialBearing,
  weaponMagazineSize,
} from "shared";
import { RoleIconMap } from "../../utils/RoleIconMap";
import {
  factionFrames,
  factionInk,
  healthInk,
  statusInk,
  shockInk,
  ACCENT,
  ALERT,
  DEAD_INK,
  KIA_INK,
  UNIT_MAX_HEALTH,
} from "./factions";

// The badge body is ~40px across; the extra box is headroom for the heading
// chevron, which sits outside the selection ring.
const SIZE = 56;
const CENTER = SIZE / 2;
const HEALTH_RADIUS = 18;
const MAG_RADIUS = 13.5;

/**
 * Direction of travel, in degrees clockwise from north, or null when the unit
 * is not going anywhere. The simulation carries no facing of its own, so a
 * unit's heading is the bearing to the destination it is walking to.
 */
function heading(unit: UnitType): number | null {
  if (!unit.destination || unit.status === UnitStatusType.Kia) return null;
  const bearing = initialBearing(unit.position, unit.destination);
  return (bearing * 180) / Math.PI;
}

interface BadgeProps {
  unit: UnitType;
  faction: PlatoonFaction;
  selected: boolean;
}

/**
 * An arc starting at twelve o'clock and sweeping clockwise. Drawn as a path
 * rather than a dash-offset circle so the stroke can also be segmented without
 * the segmentation fighting the arc length.
 */
function arcPath(fraction: number, r: number): string {
  if (fraction <= 0) return "";

  if (fraction >= 0.999) {
    // Two half arcs, since a single arc cannot close a full circle.
    return `M ${CENTER} ${CENTER - r} A ${r} ${r} 0 1 1 ${CENTER} ${
      CENTER + r
    } A ${r} ${r} 0 1 1 ${CENTER} ${CENTER - r}`;
  }

  const end = -Math.PI / 2 + fraction * Math.PI * 2;
  const x = CENTER + r * Math.cos(end);
  const y = CENTER + r * Math.sin(end);
  const largeArc = fraction > 0.5 ? 1 : 0;

  return `M ${CENTER} ${CENTER - r} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`;
}

/**
 * No frame around the glyph. The two sides are told apart by how the health
 * ring is drawn — friendly solid, hostile segmented — which keeps identity on
 * an element already present rather than adding chrome back.
 *
 * Outer ring is condition, inner ring is the magazine, pips carry status and
 * whether the unit is down to its sidearm.
 */
const UnitBadge = ({ unit, faction, selected }: BadgeProps) => {
  const Glyph = RoleIconMap[unit.role];
  const isKia = unit.status === UnitStatusType.Kia;
  const hostile = factionFrames[faction] === "hostile";

  const ink = isKia ? DEAD_INK : factionInk[faction];
  const healthFraction = Math.max(
    0,
    Math.min(1, unit.health / UNIT_MAX_HEALTH),
  );

  const weapon =
    unit.activeWeapon === "secondary"
      ? unit.secondaryWeapon
      : unit.primaryWeapon;
  const capacity = weaponMagazineSize[weapon] || 1;
  const magFraction = Math.max(0, Math.min(1, unit.magazine / capacity));
  const reloading = unit.reloadRemaining > 0;
  const onSidearm = unit.activeWeapon === "secondary";
  const bleeding = unit.bleeds.length > 0;
  const shock = unit.vitals.state;
  // One beat per cardiac cycle, so the badge literally pulses at the pulse.
  const beatSeconds = 60 / Math.max(40, unit.vitals.heartRate);
  const facing = heading(unit);

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {/* The badge of a casualty fades back, but its cross does not — that
          cross is the one thing on it still worth reading at a glance. */}
      <g opacity={isKia ? 0.45 : 1}>
        {facing !== null && (
          <path
            d={`M ${CENTER - 4} ${CENTER - 23} L ${CENTER} ${CENTER - 27} L ${
              CENTER + 4
            } ${CENTER - 23}`}
            fill="none"
            stroke={ACCENT}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`rotate(${facing.toFixed(1)} ${CENTER} ${CENTER})`}
          />
        )}

        {selected && (
          <circle
            cx={CENTER}
            cy={CENTER}
            r={HEALTH_RADIUS + 4}
            fill="none"
            stroke={ACCENT}
            strokeWidth={1}
            strokeDasharray="2 3"
            opacity={0.85}
          />
        )}

        {/* A scrim, not a frame — keeps the glyph legible over map tiles. */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={MAG_RADIUS - 1.5}
          fill="#0A0A0A"
          fillOpacity={0.74}
        />

        {/* Condition, outer ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={HEALTH_RADIUS}
          fill="none"
          stroke="#242424"
          strokeWidth={2.5}
        />
        {!isKia && healthFraction > 0 && (
          <path
            d={arcPath(healthFraction, HEALTH_RADIUS)}
            fill="none"
            stroke={healthInk[unit.healthStatus]}
            strokeWidth={2.5}
            strokeLinecap="butt"
            strokeDasharray={hostile ? "3.5 2.5" : undefined}
          />
        )}

        {/* Magazine, inner ring. Dashed accent while swapping magazines. */}
        {!isKia && (
          <>
            <circle
              cx={CENTER}
              cy={CENTER}
              r={MAG_RADIUS}
              fill="none"
              stroke="#1E1E1E"
              strokeWidth={1.5}
            />
            {reloading ? (
              <circle
                cx={CENTER}
                cy={CENTER}
                r={MAG_RADIUS}
                fill="none"
                stroke={ACCENT}
                strokeWidth={1.5}
                strokeDasharray="2 3"
                opacity={0.9}
              />
            ) : (
              magFraction > 0 && (
                <path
                  d={arcPath(magFraction, MAG_RADIUS)}
                  fill="none"
                  stroke="#8A8A8A"
                  strokeWidth={1.5}
                  strokeLinecap="butt"
                />
              )
            )}
          </>
        )}

        {/* Vitals: a ring that beats at the casualty's own heart rate, and
            sharpens in colour as the shock index climbs. */}
        {!isKia && shock !== "stable" && (
          <circle
            className="unit-pulse"
            cx={CENTER}
            cy={CENTER}
            r={HEALTH_RADIUS + 3}
            fill="none"
            stroke={shockInk[shock]}
            strokeWidth={1.2}
            style={{ animationDuration: `${beatSeconds.toFixed(2)}s` }}
          />
        )}

        <Glyph
          x={CENTER - 8.5}
          y={CENTER - 8.5}
          width={17}
          height={17}
          style={{ color: ink }}
        />

        {/* An open wound, still bleeding. */}
        {!isKia && bleeding && (
          <path
            d={`M ${CENTER + 12.5} ${CENTER - 12.5} l 0 -5 M ${CENTER + 10} ${
              CENTER - 10
            } l -2.5 2.5`}
            stroke={ALERT}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        )}

        {!isKia && (
          <>
            {/* Status / movement, lower right */}
            <rect
              x={CENTER + 10}
              y={CENTER + 10}
              width={5.5}
              height={5.5}
              fill={statusInk[unit.status]}
              stroke="#0A0A0A"
              strokeWidth={1.2}
            />
            {/* Down to the sidearm, lower left */}
            {onSidearm && (
              <rect
                x={CENTER - 15.5}
                y={CENTER + 10}
                width={5.5}
                height={5.5}
                fill="#0A0A0A"
                stroke="#8A8A8A"
                strokeWidth={1.2}
              />
            )}
          </>
        )}
      </g>

      {isKia && (
        <g stroke={KIA_INK} strokeWidth={2} strokeLinecap="square">
          <line
            x1={CENTER - 6}
            y1={CENTER - 6}
            x2={CENTER + 6}
            y2={CENTER + 6}
          />
          <line
            x1={CENTER + 6}
            y1={CENTER - 6}
            x2={CENTER - 6}
            y2={CENTER + 6}
          />
        </g>
      )}
    </svg>
  );
};

/** Cache icons by everything that changes their appearance. */
const iconCache = new Map<string, L.DivIcon>();

export function unitIcon(
  unit: UnitType,
  faction: PlatoonFaction,
  selected: boolean,
): L.DivIcon {
  // Bucket both rings so a redraw is not triggered by every fractional change.
  const healthBucket = Math.round((unit.health / UNIT_MAX_HEALTH) * 40);
  const magBucket = Math.round(
    (unit.magazine /
      (weaponMagazineSize[
        unit.activeWeapon === "secondary"
          ? unit.secondaryWeapon
          : unit.primaryWeapon
      ] || 1)) *
      12,
  );
  const facing = heading(unit);
  const facingBucket = facing === null ? "-" : Math.round(facing / 15) % 24;
  const key = [
    unit.role,
    faction,
    unit.status,
    unit.healthStatus,
    healthBucket,
    magBucket,
    unit.reloadRemaining > 0,
    unit.activeWeapon,
    facingBucket,
    selected,
  ].join("|");

  const cached = iconCache.get(key);
  if (cached) return cached;

  const icon = L.divIcon({
    html: renderToStaticMarkup(
      <UnitBadge unit={unit} faction={faction} selected={selected} />,
    ),
    className: "unit-marker",
    iconSize: [SIZE, SIZE],
    iconAnchor: [CENTER, CENTER],
  });

  iconCache.set(key, icon);
  return icon;
}

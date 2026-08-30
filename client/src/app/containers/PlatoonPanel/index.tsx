import React from "react";
import { UnitStatusType, UnitType } from "shared";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { focusUnit } from "../../../redux/slices/ui";
import { selectSelectedPlatoon } from "../../../redux/slices/platoons";
import { selectMe } from "../../../redux/slices/lobby";
import { RoleIconMap } from "../../../utils/RoleIconMap";
import {
  coverLabels,
  coverPips,
  statusLabels,
  statusInk,
  healthInk,
  shockInk,
  moraleLabels,
  UNIT_MAX_HEALTH,
} from "../../Map/factions";
import { cn } from "@/lib/utils";

const roleLabel = (role: string) =>
  role
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toUpperCase();

/** Three pips, filled to the cover level the unit is currently in. */
const CoverPips: React.FC<{ filled: number }> = ({ filled }) => (
  <span className="flex items-center gap-[2px]">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className={cn(
          "inline-block h-[6px] w-[3px]",
          i < filled ? "bg-foreground/80" : "bg-hairline",
        )}
      />
    ))}
  </span>
);

const UnitRow: React.FC<{ unit: UnitType; selected: boolean }> = ({
  unit,
  selected,
}) => {
  const dispatch = useAppDispatch();
  const Glyph = RoleIconMap[unit.role];
  const isKia = unit.status === UnitStatusType.Kia;
  const healthFraction = Math.max(
    0,
    Math.min(1, unit.health / UNIT_MAX_HEALTH),
  );

  return (
    <li>
      <button
        type="button"
        onClick={() => dispatch(focusUnit(unit.id))}
        aria-pressed={selected}
        className={cn(
          "w-full border bg-card px-2 py-2 text-left transition-colors",
          "hover:border-primary/50 focus-visible:outline-none",
          "focus-visible:ring-1 focus-visible:ring-ring",
          selected ? "border-primary/70" : "border-hairline",
          // A casualty still has a last known position worth looking at, so the
          // row stays clickable — it just reads as spent.
          isKia && "opacity-45",
        )}
      >
        <div className="flex items-start gap-2">
          <Glyph
            width={20}
            height={20}
            className="mt-[1px] shrink-0"
            style={{ color: isKia ? "#4D4D4D" : "#C8C8C8" }}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[12px] text-foreground">
                {roleLabel(unit.role)}
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-[6px] w-[6px]"
                  style={{ background: statusInk[unit.status] }}
                />
                <span className="text-[10px] uppercase tracking-label text-muted-foreground">
                  {statusLabels[unit.status]}
                </span>
              </span>
            </div>

            {/* Condition as a bar, green like the ring it mirrors on the map. */}
            <div className="mt-1.5 h-[3px] w-full bg-hairline">
              <div
                className="h-full transition-[width] duration-200"
                style={{
                  width: `${healthFraction * 100}%`,
                  background: healthInk[unit.healthStatus],
                }}
              />
            </div>

            {/* Vitals strip — pulse, pressure and the ratio between them. */}
          {(unit.vitals.state !== "stable" || unit.bleeds.length > 0) && (
            <div
              className="mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-label numeric"
              style={{ color: shockInk[unit.vitals.state] }}
            >
              <span>
                {Math.round(unit.vitals.heartRate)}
                <span className="opacity-50">bpm</span>
              </span>
              <span>
                {Math.round(unit.vitals.systolic)}
                <span className="opacity-50">sys</span>
              </span>
              <span>SI {unit.vitals.shockIndex.toFixed(2)}</span>
              {unit.bleeds.length > 0 && (
                <span>{unit.bleeds.length} BLEED</span>
              )}
            </div>
          )}

          <div className="mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-label text-muted-foreground">
              <span className="numeric">
                {Math.round(unit.health)}
                <span className="text-muted-foreground/50">
                  /{UNIT_MAX_HEALTH}
                </span>
              </span>
              <span className="numeric">
                {unit.reloadRemaining > 0 ? "RELOAD" : `${unit.magazine} RDS`}
              </span>
              <span title={moraleLabels[unit.moraleState]}>
                {moraleLabels[unit.moraleState].slice(0, 3)}
              </span>
              <span
                className="flex items-center gap-1"
                title={coverLabels[unit.cover]}
              >
                <CoverPips filled={coverPips[unit.cover]} />
              </span>
            </div>
          </div>
        </div>
      </button>
    </li>
  );
};

const PlatoonPanel: React.FC = () => {
  const selectedUnitId = useAppSelector((state) => state.ui.selectedUnitId);
  const me = useAppSelector(selectMe);
  const platoons = useAppSelector((state) => state.platoons.platoons);
  const selectedPlatoon = useAppSelector(selectSelectedPlatoon);

  // A seated player always sees their own element, whatever is selected on
  // the map. Outside a match, fall back to the selection, then to anything.
  const mine = me
    ? platoons.find((p) => p.faction === me.faction) ?? null
    : null;
  const selectedPlatoonResolved = mine ?? selectedPlatoon ?? platoons[0] ?? null;

  if (!selectedPlatoonResolved) {
    return (
      <section className="px-3 py-3">
        <h2 className="label-tech">Element</h2>
        <p className="mt-2 text-[11px] text-muted-foreground">
          No element on the ground.
        </p>
      </section>
    );
  }

  const alive = selectedPlatoonResolved.units.filter(
    (u) => u.status !== UnitStatusType.Kia
  ).length;

  return (
    <section className="flex flex-col gap-2 px-3 py-3">
      <div className="flex items-baseline justify-between">
        <h2 className="label-tech">{mine ? "Your element" : "Element"}</h2>
        <span className="numeric text-[10px] uppercase tracking-label text-muted-foreground">
          {alive}/{selectedPlatoonResolved.units.length} EFF
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold tracking-wide text-foreground">
          {selectedPlatoonResolved.id.toUpperCase()}
        </span>
        <span className="text-[10px] uppercase tracking-label text-muted-foreground">
          {selectedPlatoonResolved.strategy}
        </span>
      </div>

      <ul className="flex flex-col gap-1">
        {selectedPlatoonResolved.units.map((unit) => (
          <UnitRow
            key={unit.id}
            unit={unit}
            selected={unit.id === selectedUnitId}
          />
        ))}
      </ul>
    </section>
  );
};

export default PlatoonPanel;

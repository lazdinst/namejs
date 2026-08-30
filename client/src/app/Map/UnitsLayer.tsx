import React from "react";
import { Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { PlatoonType, UnitStatusType, UnitType } from "shared";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setSelectedPlatoon } from "../../redux/slices/platoons";
import { setSelectedUnit } from "../../redux/slices/ui";
import { unitIcon } from "./unitIcon";
import {
  factionInk,
  factionLabels,
  statusLabels,
  coverLabels,
  shockInk,
  shockLabels,
  moraleLabels,
  ACCENT,
  UNIT_MAX_HEALTH,
} from "./factions";

const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div className="flex justify-between gap-4">
    <span className="text-[10px] uppercase tracking-label text-[#737373]">
      {k}
    </span>
    <span className="numeric text-[#DEDEDE]">{v}</span>
  </div>
);

const roleLabel = (role: string) =>
  role
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toUpperCase();

interface UnitMarkerProps {
  unit: UnitType;
  platoon: PlatoonType;
  selected: boolean;
  onSelect: (unit: UnitType, platoonId: string) => void;
}

const UnitMarker: React.FC<UnitMarkerProps> = ({
  unit,
  platoon,
  selected,
  onSelect,
}) => {
  const isKia = unit.status === UnitStatusType.Kia;
  const line =
    unit.status === UnitStatusType.Engaged
      ? ACCENT
      : factionInk[platoon.faction];

  return (
    <>
      {/* The leg still to walk, so an order is visible before it completes. */}
      {unit.destination && !isKia && (
        <Polyline
          positions={[
            unit.position as LatLngExpression,
            unit.destination as LatLngExpression,
          ]}
          pathOptions={{
            color: line,
            weight: 1,
            opacity: 0.42,
            dashArray: "3 5",
          }}
        />
      )}

      <Marker
        position={unit.position as LatLngExpression}
        icon={unitIcon(unit, platoon.faction, selected)}
        zIndexOffset={isKia ? 0 : 400}
        eventHandlers={{ click: () => onSelect(unit, platoon.id) }}
      >
        <Tooltip direction="top" offset={[0, -22]} opacity={1}>
          <div className="min-w-[150px] space-y-1">
            <div className="flex items-baseline justify-between gap-4 pb-1">
              <span className="font-bold text-[#EBEBEB]">
                {unit.id.toUpperCase()}
              </span>
              <span className="text-[10px] uppercase tracking-label text-[#737373]">
                {factionLabels[platoon.faction]}
              </span>
            </div>
            <Row k="Role" v={roleLabel(unit.role)} />
            {isKia ? (
              <>
                <Row k="Status" v="KIA" />
                <Row
                  k="Killed by"
                  v={unit.killedBy ? unit.killedBy.toUpperCase() : "BLED OUT"}
                />
                {unit.damageTaken.length > 0 && (
                  <Row k="Rounds taken" v={unit.damageTaken.length} />
                )}
              </>
            ) : (
              <>
                <Row
                  k="Cond"
                  v={`${Math.round(unit.health)}/${UNIT_MAX_HEALTH}`}
                />
                <Row k="Status" v={statusLabels[unit.status]} />
                <Row k="Nerve" v={moraleLabels[unit.moraleState]} />
                <Row k="Cover" v={coverLabels[unit.cover]} />
                <Row
                  k="Ammo"
                  v={
                    unit.reloadRemaining > 0
                      ? "RELOADING"
                      : `${unit.magazine} RDS`
                  }
                />

                {/* Vitals — what a medic would read off the casualty. */}
                <div className="mt-1 border-t border-white/10 pt-1">
                  <Row
                    k="HR / BP"
                    v={`${Math.round(unit.vitals.heartRate)} / ${Math.round(
                      unit.vitals.systolic,
                    )}`}
                  />
                  <Row
                    k="Shock idx"
                    v={
                      <span style={{ color: shockInk[unit.vitals.state] }}>
                        {unit.vitals.shockIndex.toFixed(2)}{" "}
                        {shockLabels[unit.vitals.state]}
                      </span>
                    }
                  />
                  {unit.bleeds.length > 0 && (
                    <Row
                      k="Bleeding"
                      v={
                        <span style={{ color: shockInk.shock }}>
                          {unit.bleeds.join(", ").toUpperCase()}
                        </span>
                      }
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </Tooltip>
      </Marker>
    </>
  );
};

const UnitsLayer: React.FC = () => {
  const dispatch = useAppDispatch();
  const map = useMap();
  const platoons = useAppSelector((state) => state.platoons.platoons);
  const selectedPlatoonId = useAppSelector(
    (state) => state.platoons.selectedPlatoonId,
  );

  // Clicking a unit selects its platoon and brings it to the centre of the
  // view, so the panel and the map are always talking about the same thing.
  const selectUnit = (unit: UnitType, platoonId: string) => {
    dispatch(setSelectedPlatoon(platoonId));
    // Mark it selected too, so the roster row highlights to match. Not
    // focusUnit: the pan happens here, and asking twice would fight itself.
    dispatch(setSelectedUnit(unit.id));
    map.panTo(unit.position as LatLngExpression, { animate: true });
  };

  // Every unit draws its own badge. Overlapping symbols at a wide zoom are
  // preferred to collapsing them: a reader looking at a section wants to see
  // the section, not a count they have to zoom in to unpack.
  return (
    <>
      {platoons.flatMap((platoon) =>
        platoon.units.map((unit) => (
          <UnitMarker
            key={unit.id}
            unit={unit}
            platoon={platoon}
            selected={platoon.id === selectedPlatoonId}
            onSelect={selectUnit}
          />
        )),
      )}
    </>
  );
};

export default UnitsLayer;

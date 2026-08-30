import React from "react";
import { Circle, Marker, Polyline, Tooltip } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { PlatoonFaction, FlightType, ObjectiveType, LandingZoneType } from "shared";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectMe, setPendingLandingZone } from "../../redux/slices/lobby";
import { factionInk, factionLabels, ACCENT, ALERT } from "./factions";

/**
 * The ground the fight is about: objectives, landing zones, and the flights
 * bringing elements in. Rendered under the unit layer so men stand on top.
 */

// ------------------------------------------------------------ objectives

const ObjectiveMarker: React.FC<{ objective: ObjectiveType }> = ({ objective }) => {
  const centre = objective.position as LatLngExpression;
  const holderInk = objective.holder ? factionInk[objective.holder] : "#5A5A5A";
  const capturing = objective.capturingFaction;
  const progressInk = capturing ? factionInk[capturing] : ACCENT;

  const icon = L.divIcon({
    className: "unit-marker",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: renderToStaticMarkup(
      <svg width="30" height="30" viewBox="0 0 30 30">
        <rect x="4" y="4" width="22" height="22" fill="#0A0A0A" fillOpacity={0.85}
          stroke={objective.contested ? ALERT : holderInk} strokeWidth={1.6}
          strokeDasharray={objective.holder ? undefined : "3 2.5"} />
        <text x="15" y="16" textAnchor="middle" dominantBaseline="middle"
          fontFamily="JetBrains Mono, monospace" fontSize="13" fontWeight={700}
          fill={holderInk}>{objective.id}</text>
      </svg>
    ),
  });

  return (
    <>
      {/* Capture radius. Fill tracks who holds it; ring tracks contest. */}
      <Circle
        center={centre}
        radius={objective.radiusMeters}
        pathOptions={{
          color: objective.contested ? ALERT : holderInk,
          weight: objective.contested ? 1.5 : 1,
          opacity: 0.7,
          dashArray: objective.holder ? undefined : "4 5",
          fillColor: holderInk,
          fillOpacity: objective.holder ? 0.1 : 0.03,
        }}
      />
      {/* Capture in progress: a second ring growing outward. */}
      {objective.progress > 0 && (
        <Circle
          center={centre}
          radius={objective.radiusMeters * objective.progress}
          pathOptions={{
            color: progressInk,
            weight: 1,
            opacity: 0.9,
            fillColor: progressInk,
            fillOpacity: 0.14,
          }}
        />
      )}
      <Marker position={centre} icon={icon} zIndexOffset={100}>
        <Tooltip direction="top" offset={[0, -16]} opacity={1}>
          <div className="min-w-[150px] space-y-0.5">
            <div className="font-bold text-[#EBEBEB]">{objective.name.toUpperCase()}</div>
            <div className="text-[10px] uppercase tracking-label text-[#737373]">
              {objective.holder
                ? `HELD BY ${factionLabels[objective.holder]}`
                : "UNHELD"}
              {objective.contested && " · CONTESTED"}
            </div>
            {capturing && (
              <div className="text-[10px] uppercase tracking-label" style={{ color: progressInk }}>
                {factionLabels[capturing]} TAKING · {Math.round(objective.progress * 100)}%
              </div>
            )}
            <div className="numeric text-[10px] uppercase tracking-label text-[#737373]">
              USEC {objective.presence[PlatoonFaction.USEC]} · BEAR{" "}
              {objective.presence[PlatoonFaction.BEAR]} on the ground
            </div>
          </div>
        </Tooltip>
      </Marker>
    </>
  );
};

// ---------------------------------------------------------- landing zones

const LandingZoneMarker: React.FC<{ zone: LandingZoneType }> = ({ zone }) => {
  const dispatch = useAppDispatch();
  const phase = useAppSelector((state) => state.lobby.lobby.phase);
  const me = useAppSelector(selectMe);
  const pending = useAppSelector((state) => state.lobby.pendingLandingZoneId);

  const choosing = phase === "landing" && !!me && !me.landingZoneId;
  const confirmed = me?.landingZoneId === zone.id;
  const staged = !confirmed && choosing && pending === zone.id;
  const ink = confirmed || staged ? ACCENT : "#5A5A5A";
  const glyph = confirmed || staged ? "#D8D8D8" : "#8A8A8A";

  const icon = L.divIcon({
    className: "unit-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: renderToStaticMarkup(
      <svg width="40" height="40" viewBox="0 0 40 40">
        {/* staged: dashed accent ring; confirmed: solid */}
        <circle
          cx="20" cy="20" r="17"
          fill={confirmed || staged ? "#0A0A0A" : "none"}
          fillOpacity={0.55}
          stroke={ink}
          strokeWidth={confirmed ? 1.8 : 1.1}
          strokeDasharray={confirmed ? undefined : "2 3"}
        />
        <text x="20" y="21" textAnchor="middle" dominantBaseline="middle"
          fontFamily="JetBrains Mono, monospace" fontSize="12" fontWeight={700} fill={glyph}>H</text>
      </svg>
    ),
  });

  return (
    <Marker
      position={zone.position as LatLngExpression}
      icon={icon}
      zIndexOffset={staged || confirmed ? 90 : 50}
      eventHandlers={{
        click: () => {
          if (choosing) dispatch(setPendingLandingZone(zone.id));
        },
      }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1}>
        <div className="font-bold text-[#EBEBEB]">{zone.name.toUpperCase()}</div>
        <div className="text-[10px] uppercase tracking-label text-[#737373]">
          {zone.id}
          {confirmed && " · YOUR LZ"}
          {staged && " · SELECTED — CONFIRM IN THE PANEL"}
          {!confirmed && !staged && choosing && " · CLICK TO SELECT"}
        </div>
      </Tooltip>
    </Marker>
  );
};

// ---------------------------------------------------------------- flights

/** A helicopter, nose toward its LZ. */
const FlightMarker: React.FC<{ flight: FlightType }> = ({ flight }) => {
  const ink = factionInk[flight.faction];
  const [lat, lon] = flight.position;
  const [dLat, dLon] = flight.destination;
  const heading =
    (Math.atan2(
      (dLon - lon) * Math.cos((lat * Math.PI) / 180),
      dLat - lat
    ) * 180) / Math.PI;
  const landing = flight.status === "landing";

  const icon = L.divIcon({
    className: "unit-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: renderToStaticMarkup(
      <svg width="40" height="40" viewBox="0 0 40 40">
        <g transform={`rotate(${heading.toFixed(1)} 20 20)`}>
          {/* rotor disc */}
          <circle cx="20" cy="20" r="15" fill="none" stroke={ink} strokeWidth={0.8} opacity={0.35} />
          <line x1="5" y1="20" x2="35" y2="20" stroke={ink} strokeWidth={1} opacity={0.5} />
          <line x1="20" y1="5" x2="20" y2="35" stroke={ink} strokeWidth={1} opacity={0.5} />
          {/* fuselage, nose up */}
          <path d="M 20 9 L 24 20 L 21 27 L 19 27 L 16 20 Z" fill="#0A0A0A" stroke={ink} strokeWidth={1.4} />
          <line x1="20" y1="27" x2="20" y2="33" stroke={ink} strokeWidth={1.4} />
        </g>
        {landing && (
          <circle cx="20" cy="20" r="18" fill="none" stroke={ACCENT} strokeWidth={1} strokeDasharray="2 3" />
        )}
      </svg>
    ),
  });

  return (
    <>
      <Polyline
        positions={[flight.position as LatLngExpression, flight.destination as LatLngExpression]}
        pathOptions={{ color: ink, weight: 1, opacity: 0.35, dashArray: "2 6" }}
      />
      <Marker position={flight.position as LatLngExpression} icon={icon} zIndexOffset={600}>
        <Tooltip direction="top" offset={[0, -22]} opacity={1}>
          <div className="min-w-[150px] space-y-0.5">
            <div className="font-bold text-[#EBEBEB]">{flight.callsign}</div>
            <div className="text-[10px] uppercase tracking-label text-[#737373]">
              {factionLabels[flight.faction]} · {flight.aboard} ABOARD
            </div>
            <div className="numeric text-[10px] uppercase tracking-label text-[#737373]">
              {landing ? "LANDING" : `${Math.round(flight.remainingMeters)} M TO ${flight.landingZoneId}`}
            </div>
          </div>
        </Tooltip>
      </Marker>
    </>
  );
};

const GroundLayer: React.FC = () => {
  const objectives = useAppSelector((state) => state.game.objectives);
  const landingZones = useAppSelector((state) => state.game.landingZones);
  const flights = useAppSelector((state) => state.game.flights);

  return (
    <>
      {landingZones.map((zone) => (
        <LandingZoneMarker key={zone.id} zone={zone} />
      ))}
      {objectives.map((objective) => (
        <ObjectiveMarker key={objective.id} objective={objective} />
      ))}
      {flights.map((flight) => (
        <FlightMarker key={flight.id} flight={flight} />
      ))}
    </>
  );
};

export default GroundLayer;

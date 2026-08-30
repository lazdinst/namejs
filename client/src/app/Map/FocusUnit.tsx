import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { useAppSelector } from "../../redux/hooks";

/**
 * Centres the map when a unit is picked in the roster panel, which sits outside
 * the map and so cannot reach Leaflet itself.
 *
 * Keyed on the focus counter rather than on the unit's position: positions
 * change every tick, and panning on those would turn a one-off click into a
 * follow — which is a separate setting.
 */
const FocusUnit: React.FC = () => {
  const map = useMap();
  const unitId = useAppSelector((state) => state.ui.selectedUnitId);
  const nonce = useAppSelector((state) => state.ui.focusNonce);
  const platoons = useAppSelector((state) => state.platoons.platoons);

  // Read through a ref so a new tick does not re-run the effect.
  const latest = useRef(platoons);
  latest.current = platoons;

  // The selection is persisted across reloads, so the counter starts wherever
  // the last session left it. Anchoring here keeps a reload from yanking the
  // view away from the opening fit.
  const handled = useRef(nonce);

  useEffect(() => {
    if (nonce === handled.current) return;
    handled.current = nonce;
    if (!unitId) return;

    const unit = latest.current
      .flatMap((platoon) => platoon.units)
      .find((candidate) => candidate.id === unitId);
    if (!unit) return;

    map.panTo(unit.position as LatLngExpression, { animate: true });
  }, [unitId, nonce, map]);

  return null;
};

export default FocusUnit;

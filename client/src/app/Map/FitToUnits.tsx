import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { LatLngBoundsExpression } from "leaflet";
import { useAppSelector } from "../../redux/hooks";

/**
 * Frame every unit the first time state arrives. The starting platoons span
 * roughly 100 km, so the hardcoded zoom-13 view showed empty map.
 */
const FitToUnits: React.FC = () => {
  const map = useMap();
  const platoons = useAppSelector((state) => state.platoons.platoons);
  const hasFitted = useRef(false);

  useEffect(() => {
    if (hasFitted.current) return;

    const positions = platoons.flatMap((platoon) =>
      platoon.units.map((unit) => unit.position)
    );
    if (positions.length === 0) return;

    map.fitBounds(positions as LatLngBoundsExpression, { padding: [80, 80] });
    hasFitted.current = true;
  }, [platoons, map]);

  return null;
};

export default FitToUnits;

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";

import "leaflet/dist/leaflet.css";
import latviaRussiaBorder from "../data/ne_10m_admin_0_boundary_lines_land.json";

const center = [57.1012, 26.8173];

function MyMapComponent() {
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="Namejs"
        style={{ filter: "brightness(0.5) contrast(1.2)" }}
      />
      <GeoJSON data={latviaRussiaBorder} style={{ color: "red", weight: 2 }} />
    </MapContainer>
  );
}

export default MyMapComponent;

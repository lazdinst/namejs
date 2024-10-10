import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import latviaRussiaBorder from "../data/ne_10m_admin_0_boundary_lines_land.json";

function MyMapComponent() {
  return (
    <MapContainer
      center={[57.1012, 26.8173]}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; Namejs"
        style={{ filter: "brightness(0.5) contrast(1.2)" }}
      />
      <GeoJSON data={latviaRussiaBorder} style={{ color: "red", weight: 2 }} />
    </MapContainer>
  );
}

export default MyMapComponent;

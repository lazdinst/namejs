import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { FeatureCollection, LineString } from "geojson";
import "leaflet/dist/leaflet.css";
import latviaRussiaBorder from "../data/ne_10m_admin_0_boundary_lines_land.json";

const geoJsonData: FeatureCollection<LineString> =
  latviaRussiaBorder as FeatureCollection<LineString>;

const center: LatLngExpression = [57.1012, 26.8173];

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
      />
      <GeoJSON data={geoJsonData} style={{ color: "red", weight: 2 }} />
    </MapContainer>
  );
}

export default MyMapComponent;

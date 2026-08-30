import React from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { FeatureCollection, LineString } from "geojson";
import "leaflet/dist/leaflet.css";
import borderLines from "../../data/ne_10m_admin_0_boundary_lines_land.json";
import UnitsLayer from "./UnitsLayer";
import GroundLayer from "./GroundLayer";
import MapContextMenu from "./MapContextMenu";
import FitToUnits from "./FitToUnits";
import FocusUnit from "./FocusUnit";
import { basemap } from "./basemap";
import "./map.css";

const geoJsonData = borderLines as FeatureCollection<LineString>;

// Fallback view, used until unit positions arrive and FitToUnits takes over.
const center: LatLngExpression = [57.55, 27.25];

const Map: React.FC = () => (
  <MapContainer
    center={center}
    zoom={9}
    // The basemap sets its own correction; the two providers need opposite
    // treatment, so map.css reads it from here rather than hardcoding one.
    style={
      {
        height: "100%",
        width: "100%",
        "--basemap-filter": basemap.filter,
      } as React.CSSProperties
    }
    zoomControl={false}
  >
    <TileLayer
      url={basemap.url}
      attribution={basemap.attribution}
      maxZoom={basemap.maxZoom}
    />
    <GeoJSON
      data={geoJsonData}
      style={{ color: "#4D4D4D", weight: 1, opacity: 0.75, dashArray: "6 4" }}
    />
    <FitToUnits />
    <FocusUnit />
    <GroundLayer />
    <UnitsLayer />
    <MapContextMenu />
  </MapContainer>
);

export default Map;

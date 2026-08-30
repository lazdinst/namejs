/**
 * CARTO's basemaps require an API key. Without one they still answer 200 —
 * with a tile that reads "API KEY REQUIRED" — so a missing key looks like a
 * working map rather than a failure. Fall back to Esri's keyless dark canvas
 * and say so, rather than rendering watermarks.
 *
 * The parameter is `key`, not `api_key` — CARTO ignores an unrecognised
 * parameter and serves the watermark, so a wrong name fails exactly like no
 * key at all.
 */
const key = import.meta.env.VITE_CARTO_API_KEY;

export const basemap = key
  ? {
      url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${key}`,
      attribution:
        "Namejs &middot; &copy; CARTO, &copy; OpenStreetMap contributors",
      maxZoom: 20,
      // Already a dark basemap by design, so it only needs desaturating. The
      // slight lift keeps its ground just clear of the panel chrome.
      filter: "grayscale(1) brightness(1.35)",
    }
  : {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      attribution:
        "Namejs &middot; Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
      maxZoom: 16,
      // Esri's canvas is a mid-grey, so it needs knocking back to sit at the
      // same weight CARTO arrives at on its own.
      filter: "grayscale(1) brightness(0.62) contrast(1.15)",
    };

if (!key) {
  console.warn(
    "VITE_CARTO_API_KEY is not set — falling back to the Esri basemap. " +
      "Copy client/.env.example to client/.env and add your CARTO key."
  );
}

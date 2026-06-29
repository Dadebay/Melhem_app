/**
 * Map configuration.
 *
 * The app renders a self-hosted OpenStreetMap raster tile layer through
 * MapLibre (no Google Maps / Mapbox dependency, no API key).
 *
 * 👉 Set OSM_TILE_URL to your tile server's {z}/{x}/{y} template, e.g.
 *      https://maps.melhem.app/tiles/{z}/{x}/{y}.png
 * Keep the literal `{z}/{x}/{y}` placeholders — MapLibre fills them in.
 */
export const OSM_TILE_URL =
  'http://192.168.1.122:8080/tile/{z}/{x}/{y}.png';

/** Standard OSM raster tiles are 256px. Use 512 only for @2x/retina tiles. */
export const OSM_TILE_SIZE = 256;

/** The tile server only has tiles up to this zoom (Leaflet maxZoom). */
export const OSM_MAX_ZOOM = 18;

/** Fallback map center (Ashgabat) used until a real coordinate is known. */
export const DEFAULT_CENTER = {latitude: 37.9601, longitude: 58.3261};

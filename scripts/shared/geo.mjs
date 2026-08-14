// Single source for the geo/thumbnail helpers shared by
// generate-spot-pages.mjs and generate-spot-page-shared-data.mjs.
// app.js (browser, no module system) keeps its own parallel copy of these
// same functions — update both places if the logic here changes.

export function thumbnailSrc(src) {
  return String(src || "").replace(/^images\/(.+)\.(jpe?g|png)$/i, "images/thumbs/$1.webp");
}

export function hasMiniMapCoordinates(spot) {
  return !!(spot?.map && typeof spot.map.lat === "number" && typeof spot.map.lng === "number" && typeof spot.minutesFromTokyo === "number");
}

export function miniMapViewpoint(spot, TRACK) {
  if (!hasMiniMapCoordinates(spot) || !TRACK) return null;
  if (typeof spot.viewpoint?.lat === "number" && typeof spot.viewpoint?.lng === "number") {
    return { lat: spot.viewpoint.lat, lng: spot.viewpoint.lng };
  }
  const km = TRACK.minToKm(spot.minutesFromTokyo);
  return Number.isFinite(km) ? TRACK.latLngAtKm(km) : null;
}

export function mercatorPoint(lat, lng) {
  const safeLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const sinLat = Math.sin((safeLat * Math.PI) / 180);
  return {
    x: (lng + 180) / 360,
    y: 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI),
  };
}

export function miniMapZoomForViewpoint(spot, viewPos, distanceKm) {
  if (!viewPos) return 14;
  const spotPoint = mercatorPoint(spot.map.lat, spot.map.lng);
  const routePoint = mercatorPoint(viewPos.lat, viewPos.lng);
  const dx = Math.abs(spotPoint.x - routePoint.x);
  const dy = Math.abs(spotPoint.y - routePoint.y);
  const fitRatio = 0.3;
  const tileSize = 256;
  const zoomX = dx > 0 ? Math.floor(Math.log2((640 * fitRatio) / (dx * tileSize))) : 21;
  const zoomY = dy > 0 ? Math.floor(Math.log2((320 * fitRatio) / (dy * tileSize))) : 21;
  const fitZoom = Math.max(8, Math.min(15, zoomX, zoomY));
  if (Number.isFinite(distanceKm) && distanceKm <= 0.35) return Math.max(fitZoom, 15);
  if (Number.isFinite(distanceKm) && distanceKm <= 3) return Math.max(fitZoom, 14);
  return fitZoom;
}

import assert from "node:assert/strict";
import test from "node:test";
import {
  hasMiniMapCoordinates,
  mercatorPoint,
  miniMapViewpoint,
  miniMapZoomForViewpoint,
  thumbnailSrc,
} from "./geo.mjs";

test("thumbnailSrc maps raster originals and leaves other paths alone", () => {
  assert.equal(thumbnailSrc("images/example.JPG"), "images/thumbs/example.webp");
  assert.equal(thumbnailSrc("images/example.svg"), "images/example.svg");
  assert.equal(thumbnailSrc(null), "");
});

test("miniMapViewpoint prefers an explicit train viewpoint", () => {
  const spot = {
    map: { lat: 35, lng: 139 },
    viewpoint: { lat: 35.1, lng: 139.1 },
    minutesFromTokyo: 10,
  };
  assert.equal(hasMiniMapCoordinates(spot), true);
  assert.deepEqual(miniMapViewpoint(spot, { minToKm: () => 5, latLngAtKm: () => ({ lat: 0, lng: 0 }) }), spot.viewpoint);
});

test("miniMapViewpoint falls back to the route and rejects incomplete data", () => {
  const track = { minToKm: (minutes) => minutes * 2, latLngAtKm: (km) => ({ lat: km, lng: km + 1 }) };
  assert.deepEqual(miniMapViewpoint({ map: { lat: 35, lng: 139 }, minutesFromTokyo: 4 }, track), { lat: 8, lng: 9 });
  assert.equal(miniMapViewpoint({ map: { lat: 35 }, minutesFromTokyo: 4 }, track), null);
});

test("mercator and zoom helpers clamp extremes and prioritize close viewpoints", () => {
  assert.deepEqual(mercatorPoint(90, 180), mercatorPoint(85.05112878, 180));
  const spot = { map: { lat: 35, lng: 139 } };
  const view = { lat: 35.001, lng: 139.001 };
  assert.equal(miniMapZoomForViewpoint(spot, null, 0), 14);
  assert.ok(miniMapZoomForViewpoint(spot, view, 0.2) >= 15);
});

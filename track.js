/* =========================================================
 * 新幹線の窓 — 位置共通レイヤー
 * track.js — 東海道新幹線 線路形状ポリライン + 位置エンジン
 * ========================================================= */

(function () {
  "use strict";

  var TRACK_POINTS = [
    [35.6812, 139.7671, "Tokyo"],
    [35.665, 139.757],
    [35.646, 139.747],
    [35.6285, 139.7388, "Shinagawa"],
    [35.607, 139.723],
    [35.589, 139.694],
    [35.5766, 139.6572],
    [35.545, 139.635],
    [35.5070, 139.6176, "Shin-Yokohama"],
    [35.485, 139.588],
    [35.460, 139.530],
    [35.430, 139.470],
    [35.395, 139.415],
    [35.371, 139.375],
    [35.342, 139.300],
    [35.318, 139.245],
    [35.290, 139.200],
    [35.2564, 139.1554, "Odawara"],
    [35.232, 139.138],
    [35.200, 139.120],
    [35.160, 139.100],
    [35.130, 139.088],
    [35.1043, 139.0778, "Atami"],
    [35.103, 139.030],
    [35.108, 138.980],
    [35.118, 138.940],
    [35.1265, 138.9107, "Mishima"],
    [35.131, 138.860],
    [35.134, 138.800],
    [35.139, 138.730],
    [35.1420, 138.6636, "Shin-Fuji"],
    [35.136, 138.618],
    [35.115, 138.590],
    [35.097, 138.567],
    [35.062, 138.520],
    [35.032, 138.478],
    [35.000, 138.435],
    [34.9718, 138.3888, "Shizuoka"],
    [34.947, 138.345],
    [34.900, 138.320],
    [34.868, 138.260],
    [34.835, 138.185],
    [34.812, 138.120],
    [34.790, 138.060],
    [34.7692, 138.0147, "Kakegawa"],
    [34.746, 137.950],
    [34.727, 137.900],
    [34.712, 137.810],
    [34.7038, 137.7345, "Hamamatsu"],
    [34.692, 137.690],
    [34.697, 137.610],
    [34.700, 137.548],
    [34.716, 137.490],
    [34.732, 137.430],
    [34.7629, 137.3820, "Toyohashi"],
    [34.790, 137.330],
    [34.812, 137.288],
    [34.830, 137.222],
    [34.855, 137.162],
    [34.910, 137.090],
    [34.9690, 137.0605, "Mikawa-Anjo"],
    [35.005, 136.990],
    [35.060, 136.935],
    [35.120, 136.900],
    [35.1709, 136.8815, "Nagoya"],
    [35.200, 136.860],
    [35.225, 136.845],
    [35.280, 136.770],
    [35.3163, 136.6857, "Gifu-Hashima"],
    [35.332, 136.620],
    [35.355, 136.530],
    [35.365, 136.465],
    [35.350, 136.400],
    [35.330, 136.340],
    [35.3145, 136.2891, "Maibara"],
    [35.265, 136.250],
    [35.210, 136.210],
    [35.170, 136.160],
    [35.115, 136.085],
    [35.060, 136.020],
    [35.020, 135.960],
    [34.990, 135.900],
    [34.975, 135.830],
    [34.985, 135.780],
    [34.9858, 135.7588, "Kyoto"],
    [34.965, 135.720],
    [34.925, 135.695],
    [34.860, 135.625],
    [34.815, 135.575],
    [34.765, 135.545],
    [34.7335, 135.5002, "Shin-Osaka"],
  ];

  var R = 6371.0088;

  function toRad(d) { return (d * Math.PI) / 180; }

  function haversineKm(lat1, lng1, lat2, lng2) {
    var dLat = toRad(lat2 - lat1);
    var dLng = toRad(lng2 - lng1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function toXY(lat, lng, refLat) {
    var kx = 111.32 * Math.cos(toRad(refLat));
    return { x: lng * kx, y: lat * 110.574 };
  }

  var pts = TRACK_POINTS.map(function (p) {
    return { lat: p[0], lng: p[1], st: p[2] || null, km: 0 };
  });
  for (var i = 1; i < pts.length; i++) {
    pts[i].km = pts[i - 1].km +
      haversineKm(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
  }
  var TOTAL_KM = pts[pts.length - 1].km;

  function buildAnchors() {
    var mins = {};
    try {
      (window.ROUTE || ROUTE).refStations.forEach(function (s) { mins[s.id] = s.min; });
    } catch (e) {}
    var anchors = [];
    pts.forEach(function (p) {
      if (p.st && mins[p.st] != null) {
        anchors.push({ id: p.st, km: p.km, min: mins[p.st], lat: p.lat, lng: p.lng });
      }
    });
    return anchors;
  }
  var ANCHORS = null;
  function anchors() {
    if (!ANCHORS) ANCHORS = buildAnchors();
    return ANCHORS;
  }

  function minToKm(min) {
    var a = anchors();
    if (!a.length) return NaN;
    if (min <= a[0].min) return a[0].km;
    if (min >= a[a.length - 1].min) return a[a.length - 1].km;
    for (var i = 0; i < a.length - 1; i++) {
      if (min >= a[i].min && min <= a[i + 1].min) {
        var t = (min - a[i].min) / (a[i + 1].min - a[i].min);
        return a[i].km + t * (a[i + 1].km - a[i].km);
      }
    }
    return NaN;
  }

  function kmToMin(km) {
    var a = anchors();
    if (!a.length) return NaN;
    if (km <= a[0].km) return a[0].min;
    if (km >= a[a.length - 1].km) return a[a.length - 1].min;
    for (var i = 0; i < a.length - 1; i++) {
      if (km >= a[i].km && km <= a[i + 1].km) {
        var t = (km - a[i].km) / (a[i + 1].km - a[i].km);
        return a[i].min + t * (a[i + 1].min - a[i].min);
      }
    }
    return NaN;
  }

  function segmentAtKm(km) {
    var a = anchors();
    for (var i = 0; i < a.length; i++) {
      if (Math.abs(km - a[i].km) < 1.0) return { from: a[i], to: a[i], at: a[i] };
    }
    for (var j = 0; j < a.length - 1; j++) {
      if (km >= a[j].km && km <= a[j + 1].km) return { from: a[j], to: a[j + 1], at: null };
    }
    return null;
  }

  function projectToTrack(lat, lng) {
    var best = { km: 0, crossKm: Infinity, segIndex: 0 };
    var P = toXY(lat, lng, lat);
    for (var i = 0; i < pts.length - 1; i++) {
      var A = toXY(pts[i].lat, pts[i].lng, lat);
      var B = toXY(pts[i + 1].lat, pts[i + 1].lng, lat);
      var ABx = B.x - A.x;
      var ABy = B.y - A.y;
      var len2 = ABx * ABx + ABy * ABy;
      if (len2 === 0) continue;
      var t = ((P.x - A.x) * ABx + (P.y - A.y) * ABy) / len2;
      t = Math.max(0, Math.min(1, t));
      var Qx = A.x + t * ABx;
      var Qy = A.y + t * ABy;
      var dx = P.x - Qx;
      var dy = P.y - Qy;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < best.crossKm) {
        best = {
          km: pts[i].km + t * (pts[i + 1].km - pts[i].km),
          crossKm: d,
          segIndex: i,
        };
      }
    }
    return best;
  }

  function latLngAtKm(km) {
    if (km <= 0) return { lat: pts[0].lat, lng: pts[0].lng };
    if (km >= TOTAL_KM) return { lat: pts[pts.length - 1].lat, lng: pts[pts.length - 1].lng };
    for (var i = 0; i < pts.length - 1; i++) {
      if (km >= pts[i].km && km <= pts[i + 1].km) {
        var t = (km - pts[i].km) / (pts[i + 1].km - pts[i].km);
        return {
          lat: pts[i].lat + t * (pts[i + 1].lat - pts[i].lat),
          lng: pts[i].lng + t * (pts[i + 1].lng - pts[i].lng),
        };
      }
    }
    return { lat: pts[0].lat, lng: pts[0].lng };
  }

  function sliceLatLngsAroundKm(centerKm, radiusKm) {
    var start = Math.max(0, centerKm - radiusKm);
    var end = Math.min(TOTAL_KM, centerKm + radiusKm);
    var line = [];
    line.push(latLngAtKm(start));
    pts.forEach(function (p) {
      if (p.km > start && p.km < end) line.push({ lat: p.lat, lng: p.lng });
    });
    line.push(latLngAtKm(end));
    return line.map(function (p) { return [p.lat, p.lng]; });
  }

  window.MADO_TRACK = {
    points: pts,
    totalKm: TOTAL_KM,
    anchors: anchors,
    minToKm: minToKm,
    kmToMin: kmToMin,
    segmentAtKm: segmentAtKm,
    projectToTrack: projectToTrack,
    latLngAtKm: latLngAtKm,
    haversineKm: haversineKm,
    sliceLatLngsAroundKm: sliceLatLngsAroundKm,
    latLngs: function () {
      return pts.map(function (p) { return [p.lat, p.lng]; });
    },
  };
})();

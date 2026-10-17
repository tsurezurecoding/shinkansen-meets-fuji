/* Window and line ported from TOP 598326c3. No train calculation or modes. */
(() => {
"use strict";
if(!document.getElementById("sp-view"))return;
var D=window.MADO_TRAIN_WINDOW,$=id=>document.getElementById(id),SVGNS="http://www.w3.org/2000/svg";
var motionQuery=matchMedia('(prefers-reduced-motion: reduce)'),reduced=motionQuery.matches,spots=D.spots,byId={};
motionQuery.addEventListener('change',e=>{reduced=e.matches;line.cancelTween();});
spots.forEach(s=>byId[s.id]=s);
var current=byId.fuji;
function sideClass(s){return s.s==='AE'?'is-ae':s.s==='A'?'is-a':'is-e';}
  var line = (function () {
    var svg = $("sp-map"), host = $("sp-line");
    var W = 0, H = 0, sc = 1, padL = 16, padR = 16, padT = 20, padB = 26;
    var samples = [], layers = {}, dotEls = {}, posCache = {};
    var knob, selRing, drawn = false, trainEl = null;
    function el(name, attrs, parent) {
      var e = document.createElementNS(SVGNS, name);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    }
    function vAtKm(km) {
      var L = D.line;
      if (km <= L[0][2]) return [L[0][0], L[0][1]];
      for (var i = 0; i < L.length - 1; i++) {
        if (km <= L[i + 1][2]) { var t = (km - L[i][2]) / (L[i + 1][2] - L[i][2] || 1); return [L[i][0] + (L[i + 1][0] - L[i][0]) * t, L[i][1] + (L[i + 1][1] - L[i][1]) * t]; }
      }
      var z = L[L.length - 1]; return [z[0], z[1]];
    }
    function toS(v) { return [padL + v[0] * sc, padT + v[1] * sc]; }
    function at(km) { return toS(vAtKm(km)); }
    function pathFor(k0, k1) {
      var pts = [at(k0)];
      D.line.forEach(function (p) { if (p[2] > k0 && p[2] < k1) pts.push(toS(p)); });
      pts.push(at(k1));
      return "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L");
    }
    function build() {
      var w = Math.round(host.clientWidth);
      if (!w || w === W) return;
      W = w;
      var small = W < 520;
      padL = small ? 12 : 22; padR = small ? 14 : 30; padT = small ? 18 : 26; padB = small ? 24 : 30;
      sc = (W - padL - padR) / D.view.w;
      H = Math.round(D.view.h * sc + padT + padB);
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.setAttribute("height", H);
      svg.innerHTML = "";
      layers.base = el("g", {}, svg);
      layers.over = el("g", {}, svg);
      layers.st = el("g", {}, svg);
      layers.dots = el("g", {}, svg);
      layers.labels = el("g", {}, svg);
      layers.top = el("g", {}, svg);
      var full = pathFor(0, D.totalKm);
      var track = el("path", { d: full, class: "l-track" + (drawn || reduced ? "" : " l-draw") }, layers.base);
      if (!drawn && !reduced) { var len = track.getTotalLength(); track.style.setProperty("--len", len); }
      // 駅
      var showAll = W >= 640;
      D.stations.forEach(function (st) {
        var p = at(st.km);
        el("line", { x1: p[0], y1: p[1] - 4, x2: p[0], y2: p[1] + 4, class: "l-st" }, layers.st);
        var label = showAll ? (st.major || /名古屋|京都|静岡|浜松|米原|熱海|豊橋/.test(st.n)) && st.id !== "Shinagawa" : /^(東京|名古屋|京都|新大阪)$/.test(st.n);
        if (label) {
          var t = el("text", { x: p[0], y: p[1] + (small ? 17 : 20), class: "l-st-label", "text-anchor": st.id === "Tokyo" ? "end" : st.id === "Shin-Osaka" ? "start" : "middle" }, layers.st);
          if (st.id === "Tokyo") t.setAttribute("x", p[0] + 6);
          if (st.id === "Shin-Osaka") t.setAttribute("x", p[0] - 6);
          t.textContent = st.n;
          t.dataset.st = st.id;
        }
      });
      // 富士山の山頂
      var fuji = byId.fuji;
      if (fuji && fuji.xy) {
        var pk = toS(fuji.xy);
        el("path", { d: "M" + (pk[0] - 6) + " " + (pk[1] + 4) + "L" + pk[0] + " " + (pk[1] - 5) + "L" + (pk[0] + 6) + " " + (pk[1] + 4) + "Z", class: "l-peak" }, layers.st);
        var lt = el("text", { x: pk[0], y: pk[1] - 9, class: "l-peak-label", "text-anchor": "middle" }, layers.st);
        lt.textContent = "富士山";
        posCache.peak = pk;
      }
      // 景色の点（E=北・上、A=南・下、両側=線上。近接は外へ積む）
      var r = small ? 3.1 : 4.2, step = small ? 4.2 : 5.4, base = small ? 6 : 8;
      var last = { E: [], A: [] };
      dotEls = {};
      spots.forEach(function (s, idx) {
        var p = at(s.km), dy = 0;
        if (s.s !== "AE") {
          var arr = last[s.s], stack = 0;
          for (var j = arr.length - 1; j >= 0 && j >= arr.length - 6; j--) { if (Math.abs(arr[j].x - p[0]) < step * 1.3 && Math.abs(arr[j].y - p[1]) < step * 3) stack = Math.max(stack, arr[j].stack + 1); }
          arr.push({ x: p[0], y: p[1], stack: stack });
          dy = (base + stack * step) * (s.s === "E" ? -1 : 1);
        }
        var c = el("circle", { cx: p[0].toFixed(1), cy: (p[1] + dy).toFixed(1), r: r, class: "l-dot " + sideClass(s) + (drawn || reduced ? "" : " is-pop") }, layers.dots);
        if (!drawn && !reduced) c.style.setProperty("--d", (150 + (s.km / D.totalKm) * 1500).toFixed(0) + "ms");
        c.dataset.id = s.id;
        dotEls[s.id] = c;
        posCache[s.id] = [p[0], p[1] + dy];
      });
      // サンプル（指の位置→km）
      samples = [];
      for (var km = 0; km <= D.totalKm; km += 0.5) { var q = at(km); samples.push({ km: km, x: q[0], y: q[1] }); }
      selRing = el("circle", { r: r + 4, class: "l-sel", cx: -50, cy: -50 }, layers.top);
      knob = el("rect", { width: 16, height: 12, rx: 3.5, class: "l-knob", x: -50, y: -50 }, layers.top);
      drawn = true;
      if (current) select(current, true);
      if (onRebuild) onRebuild();
    }
    var knobKm = 0;
    function moveKnob(km) {
      knobKm = km;
      var p = at(km);
      knob.setAttribute("x", (p[0] - 8).toFixed(1));
      knob.setAttribute("y", (p[1] - 6).toFixed(1));
    }
    function select(s, silent) {
      if (!knob) return;
      var p = posCache[s.id];
      selRing.setAttribute("cx", p[0]); selRing.setAttribute("cy", p[1]);
      Object.keys(dotEls).forEach(function (id) { dotEls[id].setAttribute("r", id === s.id ? (W < 520 ? 4.6 : 6) : (W < 520 ? 3.1 : 4.2)); });
      if (!silent && !tweening) moveKnob(s.km);
    }
    var tweening = false, tweenToken = 0;
    function tweenKnob(k0, k1, ms, onStep) {
      return new Promise(function (resolve) {
        if (reduced || ms <= 0) { moveKnob(k1); if (onStep) onStep(k1, 1); resolve(); return; }
        tweening = true;
        var token = ++tweenToken, t0 = performance.now();
        function f(now) {
          if (token !== tweenToken) { resolve(); return; }
          var t = Math.min(1, (now - t0) / ms), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          var km = k0 + (k1 - k0) * e;
          moveKnob(km);
          if (onStep) onStep(km, t);
          if (t < 1) requestAnimationFrame(f); else { tweening = false; resolve(); }
        }
        requestAnimationFrame(f);
      });
    }
    function kmFromPoint(clientX, clientY) {
      var rect = svg.getBoundingClientRect();
      var x = (clientX - rect.left) * (W / rect.width), y = (clientY - rect.top) * (H / rect.height);
      var best = samples[0], bd = Infinity;
      samples.forEach(function (s) { var d = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y) * 0.3; if (d < bd) { bd = d; best = s; } });
      return best.km;
    }
    function nearestSpot(km, filter) {
      var best = null, bd = Infinity;
      spots.forEach(function (s) { if (filter && !filter(s)) return; var d = Math.abs(s.km - km); if (d < bd) { bd = d; best = s; } });
      return best;
    }
    function clearOverlay() { layers.over.innerHTML = ""; layers.labels.innerHTML = ""; host.classList.remove("is-filtered", "is-section"); Object.keys(dotEls).forEach(function (id) { dotEls[id].classList.remove("is-match", "is-out"); }); if (trainEl) { trainEl = null; } layers.top.querySelectorAll(".l-train,.l-pulse,.l-me").forEach(function (n) { n.remove(); }); }
    function highlight(ids) {
      host.classList.add("is-filtered");
      Object.keys(dotEls).forEach(function (id) { dotEls[id].classList.toggle("is-match", ids.indexOf(id) >= 0); });
    }
    function sights(ids, toPeak) {
      var pk = posCache.peak;
      ids.forEach(function (id, i) {
        var s = byId[id], p = posCache[id];
        if (!s || !p || !pk) return;
        var l = el("line", { x1: p[0], y1: p[1], x2: pk[0], y2: pk[1], class: "l-sight" + (s.s === "A" ? " is-a" : "") }, layers.over);
        l.style.setProperty("--d", (i * 140) + "ms");
      });
    }
    function section(k0, k1) {
      host.classList.add("is-section");
      var lo = Math.min(k0, k1), hi = Math.max(k0, k1);
      el("path", { d: pathFor(0, D.totalKm), class: "l-track-dim" }, layers.over);
      el("path", { d: pathFor(lo, hi), class: "l-track-hi" }, layers.over);
      Object.keys(dotEls).forEach(function (id) { var s = byId[id]; dotEls[id].classList.toggle("is-out", s.km < lo - 0.3 || s.km > hi + 0.3); });
    }
    function timeLabel(km, text, below) {
      var p = at(km);
      var t = el("text", { x: p[0], y: p[1] + (below ? 30 : -14), class: "l-tlabel", "text-anchor": "middle" }, layers.labels);
      t.textContent = text;
      return t;
    }
    function spotLabel(id, text) {
      var p = posCache[id], s = byId[id];
      if (!p) return;
      var t = el("text", { x: p[0], y: p[1] + (s.s === "A" ? 15 : -8), class: "l-tlabel", "text-anchor": "middle" }, layers.labels);
      t.textContent = text;
    }
    function train(km) {
      if (!trainEl) {
        trainEl = el("g", {}, layers.top);
        el("circle", { r: 9, class: "l-pulse" }, trainEl);
        el("circle", { r: 5.5, class: "l-train" }, trainEl);
      }
      var p = at(km);
      trainEl.setAttribute("transform", "translate(" + p[0].toFixed(1) + " " + p[1].toFixed(1) + ")");
    }
    function me(xy) {
      el("circle", { cx: xy[0], cy: xy[1], r: 5, class: "l-train l-me" }, layers.top);
    }
    function hideKnob(h) { knob.style.display = h ? "none" : ""; }
    var onRebuild = null;
    return {
      cancelTween: function () { tweenToken++; tweening = false; },
      setSpots: function (next) { spots = next; W = 0; build(); },
      build: build, at: at, toS: toS, select: select, tweenKnob: tweenKnob, moveKnob: moveKnob, kmFromPoint: kmFromPoint,
      nearestSpot: nearestSpot, clearOverlay: clearOverlay, highlight: highlight, sights: sights, section: section,
      timeLabel: timeLabel, spotLabel: spotLabel, train: train, me: me, hideKnob: hideKnob,
      get knobKm() { return knobKm; },
      set onRebuild(f) { onRebuild = f; },
    };
  })();


var glass=$('sp-glass'),front=$('sp-photo'),back=$('sp-photo-back'),serial=0,signature='';
function setPhoto(src,alt){
 var ticket=++serial;
 if(front.getAttribute('src')===src){front.alt=alt;front.classList.remove('is-on');void front.offsetWidth;front.classList.add('is-on');$('sp-empty').hidden=true;return;}
 var img=back;img.onload=function(){if(ticket!==serial)return;img.onload=null;img.alt=alt||'';img.classList.add('is-on');front.classList.remove('is-on');front.alt='';var t=front;front=img;back=t;$('sp-empty').hidden=true;};
 img.onerror=function(){if(ticket!==serial)return;clearPhoto('この景色の写真を表示できません。');};
 img.src=src;
}
function clearPhoto(message){serial++;for(const img of [front,back]){img.onload=null;img.onerror=null;img.removeAttribute('src');img.classList.remove('is-on');img.alt='';}$('sp-empty').textContent=message;$('sp-empty').hidden=false;}
function setItems(items,id){current=byId[id]||null;const next=items.map(x=>byId[x.sp.id]).filter(Boolean),key=next.map(x=>x.id).join('/');if(key!==signature){signature=key;line.setSpots(next);}else line.build();if(current&&next.includes(current))line.select(current);}
function display(item,time){const s=byId[item.sp.id];if(!s)return;current=s;glass.dataset.side=s.s;$('sp-led-text').textContent=s.n+' · '+time;$('sp-led-right').textContent=(spots.indexOf(s)+1)+' / '+spots.length;$('sp-hook').textContent=s.h||'';$('sp-seat-badge').innerHTML='<b>'+ (s.s==='AE'?'A/E':s.s)+'</b><span>'+ (s.s==='AE'?'両側で見える':s.s==='A'?'A席・海側':'E席・山側')+'</span>';setPhoto(thumbnailSrc(item.media.src),s.n);line.select(s);}
function running(on){glass.classList.toggle('is-moving',on&&!reduced);glass.classList.toggle('is-paused',!on||reduced);$('sp-top-stage').classList.toggle('is-paused',!on||reduced);}
new ResizeObserver(()=>line.build()).observe($('sp-line'));
window.MADO_TRAIN_WINDOW_STAGE={line,setItems,display,clearPhoto,running,cancel:()=>line.cancelTween(),tweenTo:id=>{const s=byId[id];if(!s)return Promise.resolve();return line.tweenKnob(line.knobKm,s.km,Math.abs(s.km-line.knobKm)>150?900:1300);},photoState:()=>({src:front.getAttribute('src'),loaded:front.naturalWidth>0,serial}),source:'598326c3657acf344157e13200dd28c8c42b99d1'};
})();

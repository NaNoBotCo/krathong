/* app.js — every drawing on the page. The geometry and the floating live in krathong.js (window.K). */
(function () {
  "use strict";
  var U = window.UI || {}, TAU = Math.PI * 2, DPR = Math.min(2, window.devicePixelRatio || 1);
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CARD = document.documentElement.classList.contains("card");
  var $ = function (id) { return document.getElementById(id); };
  var TH = U.lang === "th";
  var LEAF = { up: "#2f8a3c", upHi: "#4fae55", back: "#9fd27f", backHi: "#c4e7a3", edge: "#1d5a27", vein: "rgba(20,70,25,.35)", veinB: "rgba(60,110,40,.28)" };

  function fit(cv, h) {
    var w = cv.clientWidth || 600;
    if (typeof h === "function") h = h(w);
    cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR); cv.style.height = h + "px";
    var c = cv.getContext("2d"); c.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { c: c, w: w, h: h };
  }
  function onVisible(el, fn) {
    if (!("IntersectionObserver" in window)) { fn(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.isIntersecting); }); }, { rootMargin: "120px" }).observe(el);
  }
  function loop(el, draw) {
    var on = false, raf = 0, last = 0;
    function tick(t) { var dt = Math.min(0.05, (t - (last || t)) / 1000); last = t; draw(t / 1000, dt); if (on && !reduce) raf = requestAnimationFrame(tick); }
    onVisible(el, function (v) { on = v; cancelAnimationFrame(raf); last = 0; if (v) raf = requestAnimationFrame(tick); });
    return function () { if (!on || reduce) draw(performance.now() / 1000, 0); };
  }
  function fmt(n, d) { return Number(n).toLocaleString(TH ? "th-TH" : "en-US", { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d == null ? 0 : d }); }
  function val(id) { var e = $(id); return e ? +e.value : 0; }
  function on(ids, fn) { ids.forEach(function (id) { var e = $(id); if (e) e.addEventListener("input", fn); }); }
  function setText(id, s) { var e = $(id); if (e) e.textContent = s; }
  function rnd(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* ---------- a krathong seen from the side and a little above ---------- */
  /* x, y = centre of the waterline; s = radius of the base in px; tilt in radians */
  function drawKrathong(c, x, y, s, now, ph, opt) {
    opt = opt || {};
    var squash = 0.42, nR = opt.rings || 3, lit = opt.lit !== false;
    c.save(); c.translate(x, y); if (opt.tilt) c.rotate(opt.tilt);
    // the banana-trunk base, a short drum
    var th = s * 0.32;
    c.fillStyle = "#c9d79a"; c.beginPath(); c.ellipse(0, 0, s, s * squash, 0, 0, Math.PI); c.lineTo(-s, -th); c.ellipse(0, -th, s, s * squash, 0, Math.PI, 0, true); c.closePath(); c.fill();
    c.strokeStyle = "rgba(90,110,50,.5)"; c.lineWidth = 1; c.stroke();
    // petals, ring by ring, back ones first, each a pointed leaf standing outward
    for (var k = 0; k < nR; k++) {
      var r = s * (1.02 - 0.22 * k), n = Math.max(6, Math.round(11 - 2 * k + s / 14)), off = k % 2 ? Math.PI / n : 0, base = -th - k * s * 0.16, hgt = s * (0.42 + 0.04 * k);
      var order = [];
      for (var i = 0; i < n; i++) order.push(off + i * TAU / n);
      order.sort(function (a, b) { return Math.sin(a) - Math.sin(b); });
      order.forEach(function (a) {
        var cx = Math.cos(a) * r, cy = Math.sin(a) * r * squash + base, pw = TAU * r / n * 0.92;
        var tx = Math.cos(a) * (r + hgt * 0.35), ty = Math.sin(a) * (r + hgt * 0.35) * squash + base - hgt;
        var px = -Math.sin(a) * pw / 2, py = Math.cos(a) * pw / 2 * squash;
        var front = Math.sin(a) > 0;
        c.beginPath(); c.moveTo(cx - px, cy - py); c.quadraticCurveTo(cx - px * 0.9 + (tx - cx) * 0.55, cy - py * 0.9 + (ty - cy) * 0.55, tx, ty);
        c.quadraticCurveTo(cx + px * 0.9 + (tx - cx) * 0.55, cy + py * 0.9 + (ty - cy) * 0.55, cx + px, cy + py); c.closePath();
        var pg = c.createLinearGradient(cx, cy, tx, ty);
        pg.addColorStop(0, front ? "#2a7f36" : "#1f6a2b"); pg.addColorStop(1, front ? (k % 2 ? "#58b85e" : "#46a84f") : "#2f8a3c");
        c.fillStyle = pg; c.fill();
        c.strokeStyle = "rgba(15,60,20,.55)"; c.lineWidth = 0.8; c.stroke();
        c.strokeStyle = "rgba(190,230,150,.35)"; c.beginPath(); c.moveTo(cx, cy); c.lineTo(tx, ty); c.stroke();
      });
    }
    // flowers on top
    var top = -th - nR * s * 0.18;
    var cols = ["#ffb000", "#ff7a1a", "#ffd23f", "#ff5d8f", "#fff2b0"];
    for (var j = 0; j < 7; j++) {
      var fa = j / 7 * TAU + 0.4, fr = s * 0.32;
      var fx = Math.cos(fa) * fr, fy = top + Math.sin(fa) * fr * squash;
      c.fillStyle = cols[j % cols.length]; c.beginPath(); c.arc(fx, fy, s * 0.13, 0, TAU); c.fill();
      c.fillStyle = "rgba(160,60,0,.35)"; c.beginPath(); c.arc(fx, fy, s * 0.05, 0, TAU); c.fill();
    }
    // three incense sticks and a candle
    c.strokeStyle = "#8a3b1c"; c.lineWidth = Math.max(1, s * 0.03);
    [-0.12, 0, 0.12].forEach(function (dx) { c.beginPath(); c.moveTo(s * (0.22 + dx), top); c.lineTo(s * (0.28 + dx * 1.6), top - s * 0.95); c.stroke(); c.fillStyle = "#ff6a3a"; c.beginPath(); c.arc(s * (0.28 + dx * 1.6), top - s * 0.95, Math.max(1, s * 0.035), 0, TAU); c.fill(); });
    c.fillStyle = "#fff4dc"; c.fillRect(-s * 0.07, top - s * 0.62, s * 0.14, s * 0.62);
    if (lit) {
      var fl = 1 + 0.12 * Math.sin(now * 13 + ph) + 0.06 * Math.sin(now * 29 + ph * 2), fy0 = top - s * 0.62;
      var g = c.createRadialGradient(0, fy0 - s * 0.12, 0, 0, fy0 - s * 0.12, s * 1.6);
      g.addColorStop(0, "rgba(255,210,120,.55)"); g.addColorStop(1, "rgba(255,160,60,0)");
      c.fillStyle = g; c.fillRect(-s * 1.6, fy0 - s * 1.7, s * 3.2, s * 3.2);
      c.fillStyle = "#ffe9a8"; c.beginPath(); c.ellipse(0, fy0 - s * 0.12 * fl, s * 0.055, s * 0.15 * fl, 0, 0, TAU); c.fill();
      c.fillStyle = "#fffdf2"; c.beginPath(); c.ellipse(0, fy0 - s * 0.08 * fl, s * 0.025, s * 0.07 * fl, 0, 0, TAU); c.fill();
    }
    c.restore();
  }

  /* ---------- the hero: the Ping at night, krathongs going downstream ---------- */
  (function hero() {
    var cv = $("scene"); if (!cv) return;
    var S, ks = [], stars = [], R = rnd(9), spawnAt = 0, clock = 0;
    function size() {
      S = fit(cv, function (w) { return CARD ? innerHeight : Math.max(460, Math.min(innerHeight * 0.78, 720)); });
      stars = []; var r = rnd(4);
      for (var i = 0; i < 120; i++) stars.push([r() * S.w, r() * S.h * 0.4, r() * 1.2 + 0.2, r() * TAU]);
    }
    var hy = function () { return S.h * 0.44; };
    function spawn(x, d) {
      var depth = d == null ? Math.pow(R(), 0.8) : d;            // 0 far bank … 1 near bank
      ks.push({ x: x == null ? -60 : x, d: depth, ph: R() * TAU, v: 0.4 + 0.6 * (1 - Math.abs(depth - 0.5) * 2), rings: 2 + Math.floor(R() * 2), lit: R() > 0.04 });
    }
    function draw(now, dt) {
      var c = S.c, w = S.w, h = S.h, y0 = hy();
      clock += dt;
      var sky = c.createLinearGradient(0, 0, 0, y0); sky.addColorStop(0, "#071a2b"); sky.addColorStop(1, "#1d3f5a");
      c.fillStyle = sky; c.fillRect(0, 0, w, y0);
      stars.forEach(function (s) { c.fillStyle = "rgba(255,250,235," + (0.3 + 0.3 * Math.sin(now + s[3])) + ")"; c.fillRect(s[0], s[1], s[2], s[2]); });
      var mx = w * 0.84, my = h * 0.12, mr = Math.max(16, Math.min(w, h) * 0.05);
      var mg = c.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 4); mg.addColorStop(0, "rgba(255,245,215,.35)"); mg.addColorStop(1, "rgba(255,245,215,0)");
      c.fillStyle = mg; c.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
      c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fillStyle = "#fff6dc"; c.fill();
      // a few khom loi going up over the far bank
      for (var q = 0; q < 9; q++) {
        var lx = ((q * 137.5 + now * 4) % (w + 80)) - 40, ly = y0 - 30 - ((now * 6 + q * 53) % (y0 * 0.9));
        c.fillStyle = "rgba(255,180,90,.85)"; c.beginPath(); c.ellipse(lx, ly, 2.6, 3.4, 0, 0, TAU); c.fill();
      }
      // the far bank: trees, the town, the bridge's arches
      c.fillStyle = "#0b2236"; c.fillRect(0, y0 - 18, w, 20);
      for (var t = 0; t < w; t += 22) { c.beginPath(); c.arc(t + 11, y0 - 18, 13 + 6 * Math.sin(t * 0.7), Math.PI, 0); c.fill(); }
      var r2 = rnd(12); for (var i = 0; i < w / 7; i++) { c.fillStyle = "rgba(255," + Math.round(180 + r2() * 60) + ",110," + (0.5 + 0.4 * r2()) + ")"; c.fillRect(r2() * w, y0 - 14 + r2() * 12, 1.6, 1.6); }
      c.fillStyle = "#123049"; c.fillRect(w * 0.52, y0 - 30, w * 0.48, 6);
      for (var a = 0; a < 4; a++) { var ax = w * 0.52 + a * w * 0.12; c.fillRect(ax, y0 - 26, 6, 26); c.beginPath(); c.moveTo(ax, y0 - 24); c.quadraticCurveTo(ax + w * 0.06, y0 - 6, ax + w * 0.12, y0 - 24); c.lineWidth = 3; c.strokeStyle = "#123049"; c.stroke(); }
      for (var b = 0; b < 12; b++) { c.fillStyle = "rgba(255,220,140," + (0.6 + 0.3 * Math.sin(now * 2 + b)) + ")"; c.fillRect(w * 0.52 + b * w * 0.04, y0 - 33, 2, 2); }
      // the water
      var wg = c.createLinearGradient(0, y0, 0, h); wg.addColorStop(0, "#123a55"); wg.addColorStop(1, "#04121d");
      c.fillStyle = wg; c.fillRect(0, y0, w, h - y0);
      c.save(); c.globalCompositeOperation = "lighter";
      for (var k = 0; k < 9; k++) { c.fillStyle = "rgba(255,240,200," + (0.16 - k * 0.015) + ")"; var yy = y0 + 6 + k * k * 3.2; c.fillRect(mx - mr * (1 - k * 0.06) + Math.sin(now * 1.4 + k) * 5, yy, mr * 2 * (1 - k * 0.06), 2); }
      c.restore();
      // ripples drifting with the current
      c.strokeStyle = "rgba(160,210,240,.12)"; c.lineWidth = 1;
      for (var rr = 0; rr < 40; rr++) { var rd = (rr * 0.618) % 1, ry = y0 + 4 + rd * rd * (h - y0), rx = ((rr * 211 + now * 20 * (0.3 + rd)) % (w + 100)) - 50; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + 16 + rd * 40, ry); c.stroke(); }
      if (!reduce && clock > spawnAt) { spawn(); spawnAt = clock + 0.9 + R() * 1.6; }
      ks.sort(function (a, b) { return a.d - b.d; });
      var keep = [];
      ks.forEach(function (k) {
        var y = y0 + 10 + k.d * k.d * (h - y0 - 30), s = 5 + k.d * k.d * 34;
        k.x += dt * k.v * (12 + 50 * k.d * k.d);
        if (k.x > w + 80) return;
        var bob = Math.sin(now * 1.6 + k.ph) * s * 0.04;
        // reflection of the flame
        c.save(); c.globalCompositeOperation = "lighter";
        if (k.lit) for (var m = 0; m < 4; m++) { c.fillStyle = "rgba(255,190,90," + (0.28 / (m + 1)) + ")"; c.fillRect(k.x - s * 0.15 + Math.sin(now * 3 + m + k.ph) * s * 0.1, y + s * 0.3 + m * s * 0.18, s * 0.3, Math.max(1, s * 0.06)); }
        c.restore();
        drawKrathong(c, k.x, y + bob, s, now, k.ph, { rings: k.rings, tilt: Math.sin(now * 1.1 + k.ph) * 0.03, lit: k.lit });
        keep.push(k);
      });
      ks = keep;
    }
    size();
    for (var i = 0; i < (CARD ? 26 : 18); i++) spawn(R() * S.w);
    var redraw = loop(cv, draw);
    addEventListener("resize", function () { size(); redraw(); });
    cv.addEventListener("pointerdown", function (e) {
      var r = cv.getBoundingClientRect(), y = e.clientY - r.top, y0 = hy();
      if (y < y0) return;
      var d = Math.sqrt(Math.max(0, Math.min(1, (y - y0 - 10) / (S.h - y0 - 30))));
      spawn(e.clientX - r.left, d); redraw();
    });
    if (reduce || CARD) draw(0, 0);
  })();

  /* ---------- fold a petal ---------- */
  (function folder() {
    var cv = $("foldcv"); if (!cv) return;
    var S, steps = U.fold_steps || [], states = [], step = 0, t = 1, playing = false, raf = 0;
    var W = 1, Hh = 1.7;
    function build() {
      var f = K.sheet(W, Hh); states = [f];
      steps.forEach(function (st) { if (st.line) f = K.fold(f, st.line[0], st.line[1]); states.push(f); });
    }
    function size() { S = fit(cv, function (w) { return Math.min(440, Math.max(320, w * 0.8)); }); }
    function proj(p, sc, cx, cy) { return [cx + (p[0] + p[2] * 0.28) * sc, cy - (p[1] * 0.93 + p[2] * 0.36) * sc]; }
    function draw() {
      var c = S.c, w = S.w, h = S.h;
      var bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#fff8e6"); bg.addColorStop(1, "#f1e6c8"); c.fillStyle = bg; c.fillRect(0, 0, w, h);
      var sc = Math.min(w * 0.42, h * 0.5), cx = w / 2, cy = h * 0.86;
      var st = steps[step] || {}, prev = states[step] || states[0];
      var faces = st.line ? K.folding(prev, st.line[0], st.line[1], t) : prev.map(function (f) {
        return { p3: f.pts.map(function (p) { return [p[0], p[1], f.layer * 0.004]; }), up: f.up, to3: (function (T) { return function (q) { return [T[0] * q[0] + T[2] * q[1] + T[4], T[1] * q[0] + T[3] * q[1] + T[5], f.layer * 0.004]; }; })(f.T), layer: f.layer };
      });
      faces.forEach(function (f) { f.zm = f.p3.reduce(function (a, p) { return a + p[2]; }, 0) / f.p3.length + (f.layer || 0) * 1e-4; });
      faces.sort(function (a, b) { return a.zm - b.zm; });
      // shadow
      c.fillStyle = "rgba(90,70,30,.12)"; c.beginPath(); c.ellipse(cx, cy + 10, sc * 0.6, sc * 0.08, 0, 0, TAU); c.fill();
      faces.forEach(function (f) {
        var pts = f.p3.map(function (p) { return proj(p, sc, cx, cy); });
        var A = 0; for (var i = 0; i < pts.length; i++) { var a = pts[i], b = pts[(i + 1) % pts.length]; A += a[0] * b[1] - b[0] * a[1]; }
        var shiny = (A < 0) ? f.up : !f.up;     // screen y runs down, so a face seen from above winds negative
        c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath();
        var g = c.createLinearGradient(pts[0][0], pts[0][1], pts[Math.floor(pts.length / 2)][0], pts[Math.floor(pts.length / 2)][1]);
        g.addColorStop(0, shiny ? LEAF.up : LEAF.back); g.addColorStop(1, shiny ? LEAF.upHi : LEAF.backHi);
        c.fillStyle = g; c.fill();
        // veins run the length of the strip, as they do across a banana leaf cut this way
        if (f.to3) {
          c.save(); c.clip(); c.strokeStyle = shiny ? LEAF.vein : LEAF.veinB; c.lineWidth = 1;
          for (var vx = -W / 2 + 0.06; vx < W / 2; vx += 0.075) { var p0 = proj(f.to3([vx, -0.1]), sc, cx, cy), p1 = proj(f.to3([vx, Hh + 0.1]), sc, cx, cy); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); }
          c.restore();
        }
        c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath();
        c.strokeStyle = LEAF.edge; c.lineWidth = 1.4; c.lineJoin = "round"; c.stroke();
      });
      if (st.line && t < 1) {                   // the crease to come
        var a3 = proj([st.line[0][0], st.line[0][1], 0.01], sc, cx, cy), b3 = proj([st.line[1][0], st.line[1][1], 0.01], sc, cx, cy);
        var dx = b3[0] - a3[0], dy = b3[1] - a3[1];
        c.setLineDash([7, 6]); c.strokeStyle = "#c2410c"; c.lineWidth = 2; c.beginPath(); c.moveTo(a3[0] - dx * 0.15, a3[1] - dy * 0.15); c.lineTo(b3[0] + dx * 0.15, b3[1] + dy * 0.15); c.stroke(); c.setLineDash([]);
      }
      var tx = $("foldtext"); if (tx) tx.innerHTML = st.text || "";
      document.querySelectorAll("[data-fstep]").forEach(function (b) { b.setAttribute("aria-pressed", +b.getAttribute("data-fstep") === step ? "true" : "false"); });
      if (st.angle) setText("fangle", st.angle);
    }
    function play(from) {
      cancelAnimationFrame(raf); step = from; t = 0; playing = true;
      var t0 = performance.now();
      (function tick() {
        t = Math.min(1, (performance.now() - t0) / 1400);
        if (reduce) t = 1;
        draw();
        if (t < 1) { raf = requestAnimationFrame(tick); return; }
        if (playing && step < steps.length - 1) { setTimeout(function () { if (playing) play(step + 1); }, 700); }
        else { playing = false; }
      })();
    }
    document.querySelectorAll("[data-fstep]").forEach(function (b) {
      b.addEventListener("click", function () { playing = false; cancelAnimationFrame(raf); var k = +b.getAttribute("data-fstep"); step = k; t = 0; var t0 = performance.now(); (function tick() { t = reduce ? 1 : Math.min(1, (performance.now() - t0) / 1400); draw(); if (t < 1) raf = requestAnimationFrame(tick); })(); });
    });
    var pb = $("fplay"); if (pb) pb.addEventListener("click", function () { play(0); });
    build(); size(); step = 0; t = 0; draw();
    onVisible(cv, function (v) { if (v && !playing && step === 0 && t === 0) play(0); });
    addEventListener("resize", function () { size(); draw(); });
  })();

  /* ---------- rings of petals ---------- */
  (function ringer() {
    var cv = $("ringcv"); if (!cv) return;
    var S;
    function size() { S = fit(cv, function (w) { return Math.min(460, Math.max(320, w * 0.85)); }); }
    function draw(now) {
      var D = val("rd"), pw = val("rw") / 10, nR = val("rn"), lap = val("rl") / 100;
      setText("rdo", fmt(D) + (TH ? " ซม." : " cm")); setText("rwo", fmt(pw, 1) + (TH ? " ซม." : " cm")); setText("rno", fmt(nR)); setText("rlo", fmt(lap * 100) + "%");
      var G = K.rings(D / 2, pw, lap, nR, 0.17), c = S.c, w = S.w, h = S.h;
      setText("rper", G.rings.map(function (r) { return fmt(r.n); }).join(" + "));
      setText("rtot", fmt(G.total));
      setText("rleaf", fmt(Math.ceil(G.total / (U.petals_per_leaf || 12))));
      var bg = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7); bg.addColorStop(0, "#fffaf0"); bg.addColorStop(1, "#efe2c4");
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      var sc = Math.min(w, h) * 0.38 / (D / 2 + pw * 0.9), cx = w / 2, cy = h / 2;
      c.fillStyle = "#d9e3a8"; c.beginPath(); c.arc(cx, cy, D / 2 * sc, 0, TAU); c.fill(); c.strokeStyle = "#a9b878"; c.stroke();
      G.rings.forEach(function (ring, k) {
        var r = ring.r * sc, len = pw * 1.25 * sc;
        for (var i = 0; i < ring.n; i++) {
          var a = ring.off + i * TAU / ring.n, half = Math.PI / ring.n / (1 - lap) * 0.98;
          var x0 = cx + Math.cos(a - half) * r * 0.86, y0 = cy + Math.sin(a - half) * r * 0.86, x1 = cx + Math.cos(a + half) * r * 0.86, y1 = cy + Math.sin(a + half) * r * 0.86;
          var tx = cx + Math.cos(a) * (r + len * 0.5), ty = cy + Math.sin(a) * (r + len * 0.5);
          c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx + Math.cos(a - half * 0.6) * (r + len * 0.2), cy + Math.sin(a - half * 0.6) * (r + len * 0.2), tx, ty);
          c.quadraticCurveTo(cx + Math.cos(a + half * 0.6) * (r + len * 0.2), cy + Math.sin(a + half * 0.6) * (r + len * 0.2), x1, y1); c.closePath();
          c.fillStyle = k % 2 ? "#3c9c45" : "#2f8a3c"; c.fill(); c.strokeStyle = "rgba(15,60,20,.6)"; c.lineWidth = 1; c.stroke();
          c.strokeStyle = "rgba(200,240,160,.4)"; c.beginPath(); c.moveTo(cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86); c.lineTo(tx, ty); c.stroke();
          c.fillStyle = "#b07a2a"; c.beginPath(); c.arc(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82, 1.6, 0, TAU); c.fill();   // the pin
        }
      });
      var inner = G.rings.length ? G.rings[G.rings.length - 1].r * sc * 0.75 : D / 2 * sc;
      var cols = ["#ffb000", "#ff7a1a", "#ffd23f", "#ff5d8f"];
      for (var j = 0; j < 9; j++) { var fa = j / 9 * TAU, fr = inner * 0.55; c.fillStyle = cols[j % 4]; c.beginPath(); c.arc(cx + Math.cos(fa) * fr, cy + Math.sin(fa) * fr, inner * 0.24, 0, TAU); c.fill(); }
      c.fillStyle = "#fff4dc"; c.beginPath(); c.arc(cx, cy, inner * 0.2, 0, TAU); c.fill();
      c.fillStyle = "#ffcf5a"; c.beginPath(); c.arc(cx, cy, inner * 0.08 * (1 + 0.15 * Math.sin(now * 12)), 0, TAU); c.fill();
    }
    size(); var redraw = loop(cv, draw);
    on(["rd", "rw", "rn", "rl"], function () { redraw(); });
    addEventListener("resize", function () { size(); redraw(); });
    draw(0);
  })();

  /* ---------- will it float ---------- */
  (function floater() {
    var cv = $("floatcv"); if (!cv) return;
    var S, coins = 0, tilt = 0;
    function size() { S = fit(cv, function (w) { return Math.min(400, Math.max(300, w * 0.62)); }); }
    function state() {
      return K.float({ D: val("bd") / 100, t: val("bt") / 100, rho: val("brho"), load: val("bl") / 1000, loadH: 0.4 * val("bh") / 100, coins: coins, coin: (U.coin_g || 3) / 1000 });
    }
    function draw(now) {
      var f = state(), c = S.c, w = S.w, h = S.h, D = val("bd") / 100, T = val("bt") / 100, Hc = val("bh") / 100;
      setText("bdo", fmt(D * 100) + (TH ? " ซม." : " cm")); setText("bto", fmt(T * 100, 1) + (TH ? " ซม." : " cm"));
      setText("brhoo", fmt(val("brho")) + " kg/m³"); setText("blo", fmt(val("bl")) + " g"); setText("bho", fmt(Hc * 100) + (TH ? " ซม." : " cm"));
      setText("bmass", fmt(f.M * 1000) + " g"); setText("bsink", f.sinks ? (TH ? "จม" : "under") : fmt(f.d * 100, 1) + (TH ? " ซม." : " cm"));
      setText("bfree", f.sinks ? "–" : fmt(f.free * 100, 1) + (TH ? " ซม." : " cm"));
      setText("bcoins", f.sinks ? "0" : fmt(f.coinsLeft)); setText("bcount", fmt(coins));
      setText("bgm", f.sinks ? "–" : fmt(f.GM * 100, 1) + (TH ? " ซม." : " cm"));
      var st = $("bstate"); if (st) st.textContent = f.sinks ? U.b_sunk : f.GM <= 0 ? U.b_tips : U.b_ok;
      // a steady breeze leans it; the righting arm GM·sinθ pushes back
      // a 3 m/s breeze on the part above water: F = ½·ρair·v²·area, at the middle of that height
      var above = Math.max(0, T - f.d) + Hc, F = 0.5 * 1.2 * 9 * D * above * 0.5, arm = above / 2 + f.d / 2;
      var target = f.sinks ? 0 : f.GM <= 0 ? 1.2 : Math.atan(F * arm / (f.M * 9.81 * f.GM));
      setText("bheel", f.sinks || f.GM <= 0 ? "–" : fmt(target * 180 / Math.PI, 1) + "°");
      tilt += (Math.min(1.3, target) - tilt) * 0.08;
      var wl = h * 0.62, sc = Math.min(w * 0.55 / D, (wl - 24) / (T + Hc + 0.03));
      c.fillStyle = "#e9f6ff"; c.fillRect(0, 0, w, wl);
      var wg = c.createLinearGradient(0, wl, 0, h); wg.addColorStop(0, "#5fb3e6"); wg.addColorStop(1, "#1d5f8f");
      // the krathong body in the water: base sits so its waterline depth matches d
      var d = Math.min(f.d, T + 0.02), baseTop = wl - (T - d) * sc - Math.sin(now * 1.5) * 1.5;
      c.save(); c.translate(w / 2, baseTop + T * sc); c.rotate(tilt);
      c.fillStyle = "#cfdc9e"; c.fillRect(-D / 2 * sc, -T * sc, D * sc, T * sc); c.strokeStyle = "#8ea25c"; c.lineWidth = 1.5; c.strokeRect(-D / 2 * sc, -T * sc, D * sc, T * sc);
      for (var i = 1; i < 6; i++) { c.strokeStyle = "rgba(140,160,90,.35)"; c.beginPath(); c.moveTo(-D / 2 * sc + 4, -T * sc * i / 6); c.lineTo(D / 2 * sc - 4, -T * sc * i / 6); c.stroke(); }
      // petals in profile
      var ph = Math.min(0.05, D * 0.3) * sc;
      for (var p = -3; p <= 3; p++) { var px = p / 3.4 * D / 2 * sc; c.fillStyle = Math.abs(p) % 2 ? "#3c9c45" : "#2f8a3c"; c.beginPath(); c.moveTo(px - ph * 0.35, -T * sc); c.lineTo(px + (p / 3) * ph * 0.25, -T * sc - ph); c.lineTo(px + ph * 0.35, -T * sc); c.closePath(); c.fill(); }
      // the candle at its height
      var cw = Math.max(5, 0.012 * sc);
      c.fillStyle = "#fff4dc"; c.fillRect(-cw / 2, -T * sc - Hc * sc, cw, Hc * sc); c.strokeStyle = "#d6c8a2"; c.strokeRect(-cw / 2, -T * sc - Hc * sc, cw, Hc * sc);
      if (!f.sinks) { c.fillStyle = "#ffcf5a"; c.beginPath(); c.ellipse(0, -T * sc - Hc * sc - 7, 3.5, 7 + Math.sin(now * 14), 0, 0, TAU); c.fill(); }
      // coins along the top
      for (var k = 0; k < Math.min(coins, 60); k++) { c.fillStyle = "#c9cbd0"; c.strokeStyle = "#8b8e96"; c.beginPath(); c.ellipse(-D / 2 * sc + 10 + (k % 15) * (D * sc - 20) / 14, -T * sc - 3 - Math.floor(k / 15) * 4, 6, 2.2, 0, 0, TAU); c.fill(); c.stroke(); }
      // centre of mass (G) and metacentre (M), when it floats
      if (!f.sinks) {
        var gy = -f.KG * sc, my = -(f.KB + f.BM) * sc;
        c.fillStyle = "#c2410c"; c.beginPath(); c.arc(0, gy, 5, 0, TAU); c.fill(); c.font = "700 13px system-ui,sans-serif"; c.fillText("G", 8, gy + 4);
        if (my > -h) { c.fillStyle = "#1d4ed8"; c.beginPath(); c.arc(0, my, 5, 0, TAU); c.fill(); c.fillText("M", 8, my + 4); }
      }
      c.restore();
      c.save(); c.globalAlpha = 0.72; c.fillStyle = wg; c.fillRect(0, wl, w, h - wl); c.restore();
      c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 2; c.beginPath();
      for (var x = 0; x <= w; x += 6) c.lineTo(x, wl + Math.sin(x * 0.05 + now * 2) * 1.5); c.stroke();
    }
    size(); var redraw = loop(cv, draw);
    on(["bd", "bt", "brho", "bl", "bh"], function () { redraw(); });
    var add = $("bcoin"); if (add) add.addEventListener("click", function () { coins += 5; redraw(); });
    var clr = $("bclear"); if (clr) clr.addEventListener("click", function () { coins = 0; redraw(); });
    addEventListener("resize", function () { size(); redraw(); });
    draw(0);
  })();

  /* ---------- downstream: fast in the middle, slow at the banks ---------- */
  (function river() {
    var cv = $("rivercv"); if (!cv) return;
    var S, ks = [], R = rnd(21), simT = 0, last = 0;
    var W = 80;                                  // metres across, the Ping at Nawarat at a usual November flow
    function size() { S = fit(cv, function (w) { return Math.min(360, Math.max(240, w * 0.4)); }); }
    function reset() { ks = []; simT = 0; for (var i = 0; i < 60; i++) ks.push({ x: 0, y: -W / 2 + 3 + R() * 10, ph: R() * TAU, stuck: false }); }
    function draw(now, dt) {
      var umax = val("vmax") / 100, p = val("vp") / 10, c = S.c, w = S.w, h = S.h;
      setText("vmaxo", fmt(umax, 2) + " m/s"); setText("vpo", fmt(p, 1));
      var mean = umax * p / (p + 1);              // the mean of umax·(1 − |s|^p) across the river
      setText("vmean", fmt(mean, 2) + " m/s");
      setText("v1h", fmt(umax * 3.6, 1) + (TH ? " กม." : " km"));
      setText("vnight", fmt(umax * 3.6 * 8, 0) + (TH ? " กม." : " km"));
      var speedUp = 240;                         // simulated seconds per real second
      simT += dt * speedUp;
      var span = Math.max(600, umax * simT * 1.1 + 200), kx = (w - 40) / span, ky = (h - 40) / W, top = 20;
      c.fillStyle = "#e7dcc0"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#2b6f99"; c.fillRect(0, top, w, W * ky);
      // the speed profile, drawn as shading: brighter = faster
      for (var j = 0; j < 30; j++) { var yy = -W / 2 + (j + 0.5) * W / 30, s = K.speed(yy, W, umax, p) / Math.max(0.01, umax); c.fillStyle = "rgba(170,225,255," + (0.02 + 0.5 * s * s) + ")"; c.fillRect(0, top + (yy + W / 2) * ky - W / 60 * ky, w, W / 30 * ky + 1); }
      // distance ticks
      c.fillStyle = "#3a2f1a"; c.font = "12px 'Noto Sans Thai',system-ui,sans-serif"; c.textAlign = "center";
      var stepM = span > 8000 ? 2000 : span > 3000 ? 1000 : span > 1200 ? 500 : 100;
      for (var m = 0; m <= span; m += stepM) { var x = 20 + m * kx; c.fillRect(x, top + W * ky, 1, 6); c.fillText(m >= 1000 ? fmt(m / 1000, 1) + (TH ? " กม." : " km") : fmt(m) + " m", x, top + W * ky + 18); }
      ks.forEach(function (k) {
        if (!k.stuck) {
          var u = K.speed(k.y, W, umax, p);
          k.x += u * dt * speedUp;
          k.y += (R() - 0.5) * 0.9 * Math.sqrt(dt * speedUp);          // a random walk across the current
          if (Math.abs(k.y) > W / 2 - 1.5) { k.y = Math.sign(k.y) * (W / 2 - 1.5); if (R() < 0.02) k.stuck = true; }
        }
        var x = 20 + k.x * kx, y = top + (k.y + W / 2) * ky;
        if (x > w + 10) return;
        c.fillStyle = k.stuck ? "#7a5b2a" : "#2f8a3c"; c.beginPath(); c.arc(x, y, 3.4, 0, TAU); c.fill();
        if (!k.stuck) { c.fillStyle = "#ffd36b"; c.beginPath(); c.arc(x, y, 1.4, 0, TAU); c.fill(); }
      });
      var stuck = ks.filter(function (k) { return k.stuck; }).length;
      setText("vstuck", fmt(stuck) + " / " + fmt(ks.length));
      setText("vclock", fmt(simT / 60) + (TH ? " นาที" : " min"));
      if (simT > 3 * 3600) reset();
    }
    size(); reset(); var redraw = loop(cv, draw);
    on(["vmax", "vp"], function () { reset(); redraw(); });
    var again = $("vagain"); if (again) again.addEventListener("click", function () { reset(); redraw(); });
    addEventListener("resize", function () { size(); redraw(); });
    var pv = $("vlive");
    if (pv && pv.getAttribute("data-src")) fetch(pv.getAttribute("data-src")).then(function (r) { return r.json(); }).then(function (d) {
      var s = (d.stations || []).filter(function (x) { return x.id === "P.1"; })[0];
      if (s && s.dischg != null) pv.textContent = (TH ? "สถานี P.1 สะพานนวรัฐ ตอนนี้: " : "Station P.1, Nawarat Bridge, now: ") + fmt(s.dischg, 1) + " m³/s · " + (TH ? "ระดับ " : "level ") + fmt(s.level, 2) + " m · " + s.observed.replace("T", " ");
    }).catch(function () {});
  })();

  /* ---------- the morning after: what the city collected ---------- */
  (function after() {
    var cv = $("aftercv"); if (!cv || !U.counts || !U.counts.length) return;
    var S;
    function size() { S = fit(cv, function (w) { return Math.min(380, Math.max(260, w * 0.5)); }); }
    function draw() {
      var c = S.c, w = S.w, h = S.h, rows = U.counts, pad = { l: 64, r: 12, t: 16, b: 40 };
      c.fillStyle = "#fffaf0"; c.fillRect(0, 0, w, h);
      var max = 0; rows.forEach(function (r) { max = Math.max(max, r[1] + r[2]); });
      var ymax = Math.ceil(max / 100000) * 100000, bw = (w - pad.l - pad.r) / rows.length;
      var Y = function (v) { return h - pad.b - (h - pad.t - pad.b) * v / ymax; };
      c.font = "12px 'Noto Sans Thai',system-ui,sans-serif"; c.fillStyle = "#6a5a48"; c.textAlign = "right";
      for (var v = 0; v <= ymax; v += ymax / 4) { c.fillText(fmt(v / 1000) + (TH ? " พัน" : "k"), pad.l - 6, Y(v) + 4); c.strokeStyle = "rgba(0,0,0,.06)"; c.beginPath(); c.moveTo(pad.l, Y(v)); c.lineTo(w - pad.r, Y(v)); c.stroke(); }
      rows.forEach(function (r, i) {
        var x = pad.l + i * bw + bw * 0.15, bwi = bw * 0.7;
        c.fillStyle = "#3c9c45"; c.fillRect(x, Y(r[1]), bwi, Y(0) - Y(r[1]));
        c.fillStyle = "#e05a7a"; c.fillRect(x, Y(r[1] + r[2]), bwi, Y(r[1]) - Y(r[1] + r[2]));
        if (r[3]) { c.fillStyle = "#e3a23b"; c.fillRect(x, Y(r[1] + r[2] + r[3]), bwi, Y(r[1] + r[2]) - Y(r[1] + r[2] + r[3])); }
        c.fillStyle = "#3a2f1a"; c.textAlign = "center"; c.fillText(String(TH ? r[0] + 543 : r[0]), x + bwi / 2, h - pad.b + 16);
      });
    }
    size(); draw(); addEventListener("resize", function () { size(); draw(); });
  })();
})();

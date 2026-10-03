/* krathong.js — the geometry and the floating of a krathong, shared by every drawing (window.K).
   Folding: a leaf is a flat polygon; a fold is a line across it. The part on one side of the line
   turns about it through half a turn and lands face down on top. Floating: a krathong sinks until it
   has pushed aside its own weight of water (Archimedes), and stays upright while its metacentre sits
   above its centre of mass. */
(function () {
  "use strict";
  var TAU = Math.PI * 2;

  /* ---------- folding ---------- */
  function side(p, a, b) { return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); }
  function clip(pts, a, b, keepLeft) {          // Sutherland–Hodgman against one line
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], q = pts[(i + 1) % pts.length], sp = side(p, a, b), sq = side(q, a, b);
      var ip = keepLeft ? sp >= 0 : sp <= 0, iq = keepLeft ? sq >= 0 : sq <= 0;
      if (ip) out.push(p);
      if (ip !== iq) { var t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    if (out.length < 3) return null;
    var A = 0;
    for (var k = 0; k < out.length; k++) { var u = out[k], v = out[(k + 1) % out.length]; A += u[0] * v[1] - v[0] * u[1]; }
    return Math.abs(A) > 1e-7 ? out : null;
  }
  function reflect(p, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2;
    var fx = a[0] + dx * t, fy = a[1] + dy * t;
    return [2 * fx - p[0], 2 * fy - p[1]];
  }
  /* a sheet: [{pts, layer, up}] — up = the leaf's shiny face is on top */
  var I = [1, 0, 0, 1, 0, 0];                   // affine [a b c d e f]: x' = a·x + c·y + e, y' = b·x + d·y + f
  function ap(T, p) { return [T[0] * p[0] + T[2] * p[1] + T[4], T[1] * p[0] + T[3] * p[1] + T[5]]; }
  function mul(A, B) { return [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]]; }
  function reflT(a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, c2 = (dx * dx - dy * dy) / L2, s2 = 2 * dx * dy / L2;
    var M = [c2, s2, s2, -c2, 0, 0], q = ap(M, a);
    M[4] = a[0] - q[0]; M[5] = a[1] - q[1];
    return M;
  }
  function sheet(w, h) { return [{ pts: [[-w / 2, 0], [w / 2, 0], [w / 2, h], [-w / 2, h]], layer: 0, up: true, T: I }]; }
  /* fold: the part left of a→b (seen from above) goes over onto the rest */
  function fold(faces, a, b) {
    var stay = [], move = [], top = 0;
    faces.forEach(function (f) { top = Math.max(top, f.layer); });
    faces.forEach(function (f) {
      var s = clip(f.pts, a, b, false), m = clip(f.pts, a, b, true);
      if (s) stay.push({ pts: s, layer: f.layer, up: f.up, T: f.T });
      if (m) move.push({ pts: m, layer: f.layer, up: f.up, T: f.T });
    });
    var Rf = reflT(a, b);
    move.forEach(function (f) {
      stay.push({ pts: f.pts.map(function (p) { return reflect(p, a, b); }).reverse(), layer: top + 1 + (top - f.layer), up: !f.up, T: mul(Rf, f.T) });
    });
    return stay;
  }
  /* the same fold caught part way, t in 0..1, as faces in 3D: [{p3: [[x,y,z]], up, z}] */
  function folding(faces, a, b, t) {
    var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    var ang = Math.PI * t, top = 0, out = [];
    faces.forEach(function (f) { top = Math.max(top, f.layer); });
    var lift = function (layer) { return layer * 0.004; };
    faces.forEach(function (f) {
      var s = clip(f.pts, a, b, false), m = clip(f.pts, a, b, true);
      var still = function (p) { return [p[0], p[1], lift(f.layer)]; };
      var turn = function (p) {
        var d = (p[0] - a[0]) * nx + (p[1] - a[1]) * ny, along = (p[0] - a[0]) * ux + (p[1] - a[1]) * uy;
        var fx = a[0] + ux * along, fy = a[1] + uy * along;
        return [fx + nx * d * Math.cos(ang), fy + ny * d * Math.cos(ang), d * Math.sin(ang) + lift(top + 1 + (top - f.layer)) * t];
      };
      if (s) out.push({ p3: s.map(still), up: f.up, to3: function (q) { return still(ap(f.T, q)); }, layer: f.layer });
      if (m) out.push({ p3: m.map(turn), up: f.up, to3: function (q) { return turn(ap(f.T, q)); }, moving: true, layer: top + 1 + (top - f.layer) });
    });
    return out;
  }
  function bounds(faces) {
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    faces.forEach(function (f) { f.pts.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }); });
    return [x0, y0, x1, y1];
  }

  /* ---------- a ring of petals ---------- */
  /* how many petals of width pw fit round a circle of radius r when each overlaps the next by `lap` of its width */
  function ringCount(r, pw, lap) { return Math.max(3, Math.floor(TAU * r / (pw * (1 - lap)))); }
  function rings(R, pw, lap, nRings, shrink) {
    var out = [], total = 0;
    for (var k = 0; k < nRings; k++) {
      var r = R * (1 - shrink * k);
      if (r < pw * 0.9) break;
      var n = ringCount(r, pw, lap);
      out.push({ r: r, n: n, off: k % 2 ? Math.PI / n : 0, k: k });
      total += n;
    }
    return { rings: out, total: total };
  }

  /* ---------- floating ---------- */
  /* o: {D, t (m), rho (kg/m³ of the base), load (kg), loadH (m, height of the load's centre above the base),
         coins (count), coin (kg)} */
  function float(o) {
    var r = o.D / 2, A = Math.PI * r * r, mb = o.rho * A * o.t, mc = (o.coins || 0) * (o.coin || 0.003);
    var M = mb + o.load + mc, d = M / (1000 * A);
    var KB = d / 2, BM = r * r / (4 * d);
    var KG = (mb * o.t / 2 + o.load * (o.t + o.loadH) + mc * o.t) / M;
    var GM = KB + BM - KG;
    var spare = Math.max(0, 1000 * A * o.t - M);
    return { M: M, d: d, free: o.t - d, sinks: d >= o.t, GM: GM, KG: KG, BM: BM, KB: KB, spare: spare,
             coinsLeft: Math.floor(spare / (o.coin || 0.003)), mb: mb };
  }

  /* ---------- a river: fast in the middle, slow at the banks ---------- */
  function speed(y, W, umax, p) { var s = Math.abs(2 * y / W); return s >= 1 ? 0 : umax * (1 - Math.pow(s, p || 2)); }

  window.K = { sheet: sheet, fold: fold, folding: folding, bounds: bounds, ringCount: ringCount, rings: rings, float: float, speed: speed, TAU: TAU };
})();

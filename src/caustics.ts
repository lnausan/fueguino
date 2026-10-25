// Genera, una sola vez, la red de luz (cáusticas) del fondo de la piscina.
// Usa un diagrama de Voronoi sobre puntos al azar: cada borde entre dos celdas vecinas
// es un filamento de luz compartido, como el sol atravesando el agua ondulada.

type Pt = [number, number];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Recorta un polígono con el semiplano de los puntos más cercanos a `a` que a `b`.
function clip(poly: Pt[], a: Pt, b: Pt): Pt[] {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const nx = b[0] - a[0];
  const ny = b[1] - a[1];
  const side = (p: Pt) => (p[0] - mx) * nx + (p[1] - my) * ny;
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const sp = side(p);
    const sq = side(q);
    if (sp <= 0) out.push(p);
    if ((sp < 0 && sq > 0) || (sp > 0 && sq < 0)) {
      const t = sp / (sp - sq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

export function causticPath(width: number, height: number, cell: number, seed: number): string {
  const rand = mulberry32(seed);
  const pts: Pt[] = [];
  const cols = Math.ceil(width / cell) + 3;
  const rows = Math.ceil(height / cell) + 3;
  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      pts.push([(c + 0.15 + rand() * 0.7) * cell, (r + 0.15 + rand() * 0.7) * cell]);
    }
  }
  const seen = new Set<string>();
  const parts: string[] = [];
  const reach = cell * 2.4;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    let poly: Pt[] = [
      [a[0] - reach, a[1] - reach],
      [a[0] + reach, a[1] - reach],
      [a[0] + reach, a[1] + reach],
      [a[0] - reach, a[1] + reach],
    ];
    for (let j = 0; j < pts.length; j++) {
      if (j === i) continue;
      const b = pts[j];
      if (Math.abs(b[0] - a[0]) > reach || Math.abs(b[1] - a[1]) > reach) continue;
      poly = clip(poly, a, b);
      if (poly.length < 3) break;
    }
    for (let k = 0; k < poly.length; k++) {
      const p = poly[k];
      const q = poly[(k + 1) % poly.length];
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (len < 2) continue;
      const k1 = `${Math.round(p[0])},${Math.round(p[1])}`;
      const k2 = `${Math.round(q[0])},${Math.round(q[1])}`;
      const key = k1 < k2 ? k1 + '|' + k2 : k2 + '|' + k1;
      if (seen.has(key)) continue; // cada filamento se dibuja una sola vez
      seen.add(key);
      // Filamento levemente curvo, como la luz real (no líneas rectas)
      const h = Math.sin(p[0] * 0.071 + q[1] * 0.053 + seed) * 0.5 + Math.cos(q[0] * 0.037 - p[1] * 0.061) * 0.5;
      const bend = h * len * 0.22;
      const cx = (p[0] + q[0]) / 2 + (-(q[1] - p[1]) / len) * bend;
      const cy = (p[1] + q[1]) / 2 + ((q[0] - p[0]) / len) * bend;
      parts.push(`M${p[0].toFixed(1)} ${p[1].toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`);
    }
  }
  return parts.join('');
}

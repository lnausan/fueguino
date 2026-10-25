// Genera, una sola vez, la textura de yerba: hojitas trituradas (polígonos chicos e
// irregulares) y palitos. Se agrupan por color en pocos paths para que el SVG sea liviano.

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Area = { x: number; y: number; w: number; h: number; inside?: (x: number, y: number) => boolean };

const f = (n: number) => (Math.round(n * 10) / 10).toString();

/** Hojitas: devuelve un path por color (`colors` paths). */
export function leafPaths(area: Area, count: number, minR: number, maxR: number, colors: number, seed: number): string[] {
  const rand = mulberry32(seed);
  const out: string[][] = Array.from({ length: colors }, () => []);
  for (let i = 0; i < count; i++) {
    const cx = area.x + rand() * area.w;
    const cy = area.y + rand() * area.h;
    if (area.inside && !area.inside(cx, cy)) continue;
    const r = minR + (maxR - minR) * rand() * rand();
    const a0 = rand() * Math.PI * 2;
    const stretch = 0.45 + rand() * 0.55; // hojas aplastadas, no redondas
    const n = 3 + Math.floor(rand() * 3);
    let d = '';
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + (rand() - 0.5) * 0.9;
      const rr = r * (0.55 + rand() * 0.45);
      const lx = Math.cos(a) * rr;
      const ly = Math.sin(a) * rr * stretch;
      const x = cx + lx * Math.cos(a0) - ly * Math.sin(a0);
      const y = cy + lx * Math.sin(a0) + ly * Math.cos(a0);
      d += (k === 0 ? 'M' : 'L') + f(x) + ' ' + f(y);
    }
    out[Math.floor(rand() * colors)].push(d + 'Z');
  }
  return out.map((p) => p.join(''));
}

/** Palitos: segmentos finos (se dibujan con trazo redondeado). */
export function stemPath(area: Area, count: number, minLen: number, maxLen: number, seed: number): string {
  const rand = mulberry32(seed);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const cx = area.x + rand() * area.w;
    const cy = area.y + rand() * area.h;
    if (area.inside && !area.inside(cx, cy)) continue;
    const len = minLen + (maxLen - minLen) * rand();
    const a = rand() * Math.PI * 2;
    const dx = (Math.cos(a) * len) / 2;
    const dy = (Math.sin(a) * len) / 2;
    parts.push('M' + f(cx - dx) + ' ' + f(cy - dy) + 'L' + f(cx + dx) + ' ' + f(cy + dy));
  }
  return parts.join('');
}

import React from 'react';
import { Ellipse, G, Path } from 'react-native-svg';

// Piezas comunes de los personajes, en el estilo de Fueguino: contorno oscuro grueso,
// colores planos, ojitos felices, cachetes rosados y borde de sticker color crema.
// Todos se dibujan en una caja de 200×200.

export const INK = '#2E2A27';
export const STROKE = 3;
const EDGE = '#8C857B'; // borde exterior gris del sticker
const CREAM = '#F4E8D2'; // borde crema del sticker

/** Elipse como path (para poder repetir la silueta en el borde del sticker). */
export const ell = (cx: number, cy: number, rx: number, ry = rx) =>
  `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;

/** Borde de sticker: la silueta engordada en gris y crema, por debajo del dibujo. */
export function Sticker({ silhouette }: { silhouette: string[] }) {
  return (
    <>
      {silhouette.map((d, i) => (
        <Path key={`e${i}`} d={d} fill={EDGE} stroke={EDGE} strokeWidth={17} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {silhouette.map((d, i) => (
        <Path key={`c${i}`} d={d} fill={CREAM} stroke={CREAM} strokeWidth={13} strokeLinejoin="round" strokeLinecap="round" />
      ))}
    </>
  );
}

/** Forma con relleno y contorno de tinta. */
export const Ink = ({ d, fill, w = STROKE }: { d: string; fill: string; w?: number }) => (
  <Path d={d} fill={fill} stroke={INK} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
);

/** Trazo de tinta sin relleno. */
export const Line = ({ d, w = STROKE, color = INK }: { d: string; w?: number; color?: string }) => (
  <Path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
);

/** Ojito feliz cerrado (^). */
export const HappyEye = ({ x, y }: { x: number; y: number }) => <Line d={`M${x - 6.5} ${y + 2}Q${x} ${y - 6} ${x + 6.5} ${y + 2}`} w={3.4} />;

export const Cheek = ({ x, y, color = '#F2A9AE' }: { x: number; y: number; color?: string }) => (
  <Ellipse cx={x} cy={y} rx={6.5} ry={4.2} fill={color} />
);

/** Silueta del mate (para sumarla al borde del sticker). */
export const mateSilhouette = (x: number, y: number) => [
  `M${x - 17} ${y - 8}C${x - 22} ${y + 14} ${x - 11} ${y + 26} ${x} ${y + 26}C${x + 11} ${y + 26} ${x + 22} ${y + 14} ${x + 17} ${y - 8}Z`,
  `M${x + 5} ${y - 9}L${x + 13} ${y - 36}`,
];

/** Mate con bombilla, centrado en la boca (x, y). */
export function MateProp({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Ink d={`M${x - 17} ${y - 8}C${x - 22} ${y + 14} ${x - 11} ${y + 26} ${x} ${y + 26}C${x + 11} ${y + 26} ${x + 22} ${y + 14} ${x + 17} ${y - 8}Z`} fill="#8B5A3C" />
      <Path d={`M${x - 11} ${y}C${x - 13} ${y + 10} ${x - 7} ${y + 18} ${x - 1} ${y + 19}`} fill="none" stroke="#A9744F" strokeWidth={4} strokeLinecap="round" />
      <Ink d={ell(x, y - 8, 17, 5.5)} fill="#B9B3A8" />
      <Ellipse cx={x} cy={y - 8.3} rx={12.5} ry={3.4} fill="#8F9440" />
      <Line d={`M${x + 4} ${y - 8}L${x + 13} ${y - 36}`} w={7} />
      <Line d={`M${x + 4} ${y - 8}L${x + 13} ${y - 36}`} w={3.2} color="#CFCAC0" />
    </G>
  );
}

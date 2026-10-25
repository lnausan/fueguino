export const C = {
  bg: '#FFFDF8',
  ink: '#2A2524',
  muted: '#5E554E',
  soft: '#6B625A',
  teal: '#2D6A6C',
  tealDark: '#1E4A4B',
  tealBright: '#1F7F88',
  sea: '#2B7D82',
  cream: '#F6EEDF',
  sand: '#F1EADF',
  line: '#E1D4BE',
  green: '#6FA236',
  greenInk: '#4F7A22',
  greenTint: '#E9F2DA',
  amber: '#E3A13B',
  brown: '#8A5A3B',
  blue: '#3FB6CF',
  navy: '#2F4F9E',
  pink: '#F2A7B0',
};

export const F = {
  title: 'Fredoka_700Bold',
  semi: 'Fredoka_600SemiBold',
  body: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
};

export const PENGUIN = require('../assets/fueguino-clasico.png');
export const PENGUIN_BEACH = require('../assets/fueguino.png');

export type DrinkKind = 'amargo' | 'dulce' | 'terere' | 'cocido' | 'agua';

export const DRINKS: Record<DrinkKind, { name: string; short: string; color: string; ink: string; tint: string; shape: 'gourd' | 'glass' | 'mug'; caption: string }> = {
  amargo: { name: 'Mate amargo', short: 'AMARGO', color: '#6FA236', ink: '#4F7A22', tint: '#E9F2DA', shape: 'gourd', caption: 'Mate amargo · con cafeína' },
  dulce: { name: 'Mate dulce', short: 'DULCE', color: '#E3A13B', ink: '#94590C', tint: '#FBEBCB', shape: 'gourd', caption: 'Mate dulce · con cafeína' },
  terere: { name: 'Tereré', short: 'TERERÉ', color: '#3FB6CF', ink: '#17707F', tint: '#DCF1F6', shape: 'glass', caption: 'Tereré bien frío · con cafeína' },
  cocido: { name: 'Mate cocido', short: 'COCIDO', color: '#8A5A3B', ink: '#6B3F22', tint: '#F1E2D6', shape: 'mug', caption: 'Mate cocido · con cafeína' },
  agua: { name: 'Agua', short: 'AGUA', color: '#8FD0EA', ink: '#1C6585', tint: '#E3F3FA', shape: 'glass', caption: 'Agua · sin cafeína' },
};

// Yerbateras en el orden del ranking de ventas, con sus marcas
export const YERBATERAS: [string, string[]][] = [
  ['Playadito', ['Playadito']],
  ['Las Marías', ['Taragüí', 'Unión', 'La Merced', 'Mañanita']],
  ['CBSé', ['CBSé']],
  ['La Cachuera', ['Amanda']],
  ['Cordeiro', ['Verdeflor']],
  ['Rosamonte', ['Rosamonte']],
  ['Yerbatera Misiones SRL', ['Nobleza Gaucha', 'Cruz de Malta']],
  ['Coop. Montecarlo', ['Aguantadora', 'Pampa', 'Sinceridad']],
  ['Llorente y Cía', ['La Tranquera']],
  ['Piporé', ['Piporé']],
  ['Andresito', ['Andresito']],
  ['Cachamai', ['Cachamate']],
  ['Romance', ['Romance']],
  ['Navar SRL', ['Primicia']],
  ['Estab. Imhoff', ['Buen Día']],
  ['Coop. La Hoja', ['La Hoja']],
  ['Bonafé', ['Más Sabor']],
  ['La Cumbrecita', ['La Cumbrecita']],
  ['Sanesa', ['Natura']],
  ['Mate Rojo', ['Mate Rojo']],
];

const PALETTE = ['#3F7A2A', '#B5452F', '#2F4F9E', '#7A4E33', '#C27C1E', '#2B7D82', '#6B4FC8', '#8A3E5C', '#4F6A22', '#A35A1E'];

export type Marca = { id: string; name: string; empresa: string; color: string; rank: number };

export const slug = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const MARCAS: Marca[] = YERBATERAS.flatMap(([emp, ms], gi) =>
  ms.map((m) => ({ id: slug(m), name: m, empresa: emp, color: PALETTE[gi % PALETTE.length], rank: gi + 1 })),
);

export const initials = (name: string) => {
  const w = name.split(' ').filter((x) => x.length > 2);
  return (w.length > 1 ? w.map((x) => x[0]).join('') : (w[0] || name).slice(0, 2)).slice(0, 2).toUpperCase();
};

export const FREE_CATAS = 3;

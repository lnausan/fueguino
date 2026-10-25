import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { Cheek, HappyEye, INK, Ink, Line, MateProp, Sticker, ell, mateSilhouette } from './parts';

// Personajes de la app, en el estilo de Fueguino (caja de 200×200, cada uno con su mate).

type Props = { size?: number };
const Frame = ({ size = 200, children }: Props & { children: React.ReactNode }) => (
  <Svg width={size} height={size} viewBox="0 0 200 200">
    {children}
  </Svg>
);

// ---------------------------------------------------------------- Castor
const CASTOR = {
  body: 'M100 34C138 34 150 62 147 90C160 112 160 150 146 167C131 184 69 184 54 167C40 150 40 112 53 90C50 62 62 34 100 34Z',
  tail: 'M128 170C140 150 176 140 188 152C196 164 172 188 146 186C134 185 126 178 128 170Z',
  earL: ell(64, 48, 11),
  earR: ell(136, 48, 11),
  footL: ell(74, 178, 17, 8),
  footR: ell(126, 178, 17, 8),
};

export function Castor({ size }: Props) {
  const c = CASTOR;
  return (
    <Frame size={size}>
      <Sticker silhouette={[c.tail, c.earL, c.earR, c.body, c.footL, c.footR, ...mateSilhouette(100, 140)]} />
      {/* Cola de paleta con su textura */}
      <Ink d={c.tail} fill="#5B3F2E" />
      <Line d="M140 166L168 180M150 158L182 170M162 152L188 162M146 178L166 158M158 184L180 162M172 182L188 166" w={1.6} color="#45301F" />
      <Ink d={c.earL} fill="#9C6B45" />
      <Ink d={c.earR} fill="#9C6B45" />
      <Ellipse cx={64} cy={48} rx={5.5} ry={5.5} fill="#6E4A30" />
      <Ellipse cx={136} cy={48} rx={5.5} ry={5.5} fill="#6E4A30" />
      <Ink d={c.body} fill="#9C6B45" />
      <Path d={ell(100, 146, 34, 28)} fill="#C4935F" />
      <Ink d={c.footL} fill="#6E4A30" />
      <Ink d={c.footR} fill="#6E4A30" />
      <Line d="M67 176V181M74 175V182M81 176V181M119 176V181M126 175V182M133 176V181" w={1.6} color="#4E3322" />
      {/* Cara: hocico claro, nariz, dientes grandes */}
      <Ink d={ell(100, 94, 24, 16)} fill="#EBD3B3" />
      <Ink d="M93 98H107V108Q107 111 104 111H96Q93 111 93 108Z" fill="#FFF8EA" w={2.4} />
      <Line d="M100 98V111" w={2} />
      <Line d="M89 96Q100 101 111 96" w={2.6} />
      <Ink d={ell(100, 85, 9, 6)} fill={INK} />
      <Ellipse cx={97} cy={83.5} rx={2.6} ry={1.5} fill="#fff" fillOpacity={0.7} />
      {[[86, 92], [82, 97], [114, 92], [118, 97]].map(([x, y]) => <Circle key={`${x}${y}`} cx={x} cy={y} r={1.4} fill="#8A6A4E" />)}
      <HappyEye x={78} y={70} />
      <HappyEye x={122} y={70} />
      <Cheek x={67} y={86} />
      <Cheek x={133} y={86} />
      <MateProp x={100} y={140} />
      <Ink d={ell(82, 142, 8, 7)} fill="#86593A" />
      <Ink d={ell(118, 142, 8, 7)} fill="#86593A" />
    </Frame>
  );
}

// ---------------------------------------------------------------- Trucha (arcoíris)
const TRUCHA = {
  body: 'M100 28C142 28 156 62 154 98C152 132 132 160 100 164C68 160 48 132 46 98C44 62 58 28 100 28Z',
  dorsal: 'M76 40C80 18 114 10 128 36C112 28 92 30 76 40Z',
  tail: 'M100 160C88 176 62 190 52 184C50 174 70 160 86 154ZM100 160C112 176 138 190 148 184C150 174 130 160 114 154Z',
  finL: 'M56 118C68 112 84 122 87 136C76 141 62 134 56 118Z',
  finR: 'M144 118C132 112 116 122 113 136C124 141 138 134 144 118Z',
};
const FIN = '#D9A15C';

export function Trucha({ size }: Props) {
  const t = TRUCHA;
  return (
    <Frame size={size}>
      <Sticker silhouette={[t.dorsal, t.tail, t.body, t.finL, t.finR, ...mateSilhouette(100, 134)]} />
      <Ink d={t.dorsal} fill={FIN} />
      <Line d="M89 32L91 22M100 29L102 16M112 29L115 19M121 32L123 27" w={1.5} color="#B57E3C" />
      {/* La cola hace de patitas */}
      <Ink d={t.tail} fill={FIN} />
      <Line d="M70 176L86 162M62 180L80 166M130 176L114 162M138 180L120 166" w={1.5} color="#B57E3C" />
      <Ink d={t.body} fill="#EDEBDD" />
      {/* Lomo oliva con pintitas y la franja rosada de la arcoíris */}
      <Path d="M47 100C62 90 80 96 100 92C120 88 140 94 153 100C155 62 140 28 100 28C60 28 45 62 47 100Z" fill="#879651" />
      <Path d="M47 100C62 90 80 96 100 92C120 88 140 94 153 100C153 106 152 112 151 117C138 110 120 107 100 111C80 115 62 110 49 117C48 111 47 106 47 100Z" fill="#EE9AA0" />
      <Line d={t.body} />
      {[[70, 54], [84, 42], [116, 44], [132, 56], [60, 80], [142, 80], [100, 36], [126, 104], [74, 106]].map(([x, y]) => (
        <Circle key={`${x}${y}`} cx={x} cy={y} r={2.6} fill="#3A3A2A" />
      ))}
      <Line d="M58 64Q53 82 61 96M142 64Q147 82 139 96" w={2} color="#5E6B35" />
      <HappyEye x={80} y={68} />
      <HappyEye x={120} y={68} />
      <Line d="M93 82Q100 89 107 82" w={3} />
      <Cheek x={68} y={84} />
      <Cheek x={132} y={84} />
      <MateProp x={100} y={134} />
      <Ink d={t.finL} fill={FIN} />
      <Ink d={t.finR} fill={FIN} />
    </Frame>
  );
}

// ---------------------------------------------------------------- Carpintero (gigante magallánico, macho)
const CARPINTERO = {
  crest: 'M78 50C72 28 92 12 114 14C132 16 140 30 134 40C128 32 118 30 112 36C107 41 107 46 109 50Z',
  head: ell(100, 78, 44),
  body: 'M100 96C136 96 150 124 148 148C146 170 128 182 100 182C72 182 54 170 52 148C50 124 64 96 100 96Z',
  tail: 'M88 174L92 190L100 180L108 190L112 174Z',
  wingL: 'M60 112C44 128 46 160 66 170C74 152 78 132 74 114Z',
  wingR: 'M140 112C156 128 154 160 134 170C126 152 122 132 126 114Z',
};

export function Carpintero({ size }: Props) {
  const c = CARPINTERO;
  return (
    <Frame size={size}>
      <Sticker silhouette={[c.crest, c.tail, c.body, c.wingL, c.wingR, c.head, ...mateSilhouette(100, 140)]} />
      <Ink d={c.tail} fill="#2F2C2A" />
      <Ink d={c.body} fill="#3B3835" />
      <Path d={ell(100, 152, 30, 22)} fill="#4A4642" />
      {/* Alas negras con la franja blanca */}
      <Ink d={c.wingL} fill="#2F2C2A" />
      <Ink d={c.wingR} fill="#2F2C2A" />
      <Line d="M51 142Q60 147 71 142M149 142Q140 147 129 142" w={5} color="#F4F1EA" />
      <Line d="M86 181L82 189M91 182L91 190M96 181L99 188M104 181L101 188M109 182L109 190M114 181L118 189" w={3} color="#8E8A84" />
      {/* Cabeza roja con el copete enrulado */}
      <Ink d={c.crest} fill="#C93A30" />
      <Ink d={c.head} fill="#D9473B" />
      <Path d="M72 60Q84 44 102 42" fill="none" stroke="#EC7465" strokeWidth={5} strokeLinecap="round" />
      <HappyEye x={80} y={74} />
      <HappyEye x={120} y={74} />
      <Cheek x={69} y={91} color="#F7A093" />
      <Cheek x={131} y={91} color="#F7A093" />
      <Ink d="M90 86Q100 81 110 86L102 104Q100 107 98 104Z" fill="#A8A399" />
      <Line d="M100 86L100 103" w={1.5} color="#7E796F" />
      <MateProp x={100} y={140} />
      <Ink d={ell(80, 142, 8, 7)} fill="#2F2C2A" />
      <Ink d={ell(120, 142, 8, 7)} fill="#2F2C2A" />
    </Frame>
  );
}

// ---------------------------------------------------------------- León marino (de un pelo, macho)
// Sentado erguido como en la Isla de los Lobos: melena oscura de collar, hocico con bigotes y
// el mate en las aletas de adelante; las de atrás, abiertas como patitas.
const LEON = {
  body: 'M100 30C128 30 142 50 142 76C142 96 152 120 156 146C160 172 136 186 100 186C64 186 40 172 44 146C48 120 58 96 58 76C58 50 72 30 100 30Z',
  backL: 'M70 176C56 182 40 187 33 180C37 171 56 167 73 169Z',
  backR: 'M130 176C144 182 160 187 167 180C163 171 144 167 127 169Z',
  frontL: 'M62 112C53 126 59 143 82 145C88 139 86 128 80 120Z',
  frontR: 'M138 112C147 126 141 143 118 145C112 139 114 128 120 120Z',
};
const PIEL = '#B5835A';
const ALETA = '#7E5235';

export function LeonMarino({ size }: Props) {
  const l = LEON;
  return (
    <Frame size={size}>
      <Sticker silhouette={[l.backL, l.backR, l.body, l.frontL, l.frontR, ...mateSilhouette(100, 140)]} />
      <Ink d={l.backL} fill={ALETA} />
      <Ink d={l.backR} fill={ALETA} />
      <Line d="M44 178L56 174M50 182L62 176M156 178L144 174M150 182L138 176" w={1.5} color="#5C3A24" />
      <Ink d={l.body} fill={PIEL} />
      <Path d={ell(100, 152, 33, 28)} fill="#D9AE82" />
      {/* Melena del macho, como un collar más oscuro */}
      <Path d="M60 90C72 106 128 106 140 90C143 100 143 110 138 116C122 124 78 124 62 116C57 110 57 100 60 90Z" fill="#94603D" />
      <Line d="M70 106L68 116M84 110L83 120M100 111V121M116 110L117 120M130 106L132 116" w={1.5} color="#7A4C2E" />
      {/* Orejitas chiquitas */}
      <Line d="M63 58C58 52 60 45 66 46M137 58C142 52 140 45 134 46" w={2.6} />
      {/* Cara: hocico ancho con bigotes y nariz grande */}
      <Ink d={ell(100, 80, 21, 13)} fill="#E4C197" />
      <Line d="M80 79L63 75M80 84L63 86M120 79L137 75M120 84L137 86" w={1.4} />
      {[[88, 80], [85, 85], [112, 80], [115, 85]].map(([x, y]) => <Circle key={`${x}${y}`} cx={x} cy={y} r={1.3} fill="#8A6A4E" />)}
      <Ink d="M91 71Q100 66 109 71Q107 78 100 79Q93 78 91 71Z" fill={INK} />
      <Ellipse cx={97} cy={71} rx={2.4} ry={1.3} fill="#fff" fillOpacity={0.7} />
      <Line d="M93 85Q100 90 107 85" w={2.6} />
      <HappyEye x={81} y={60} />
      <HappyEye x={119} y={60} />
      <Cheek x={70} y={76} />
      <Cheek x={130} y={76} />
      <MateProp x={100} y={140} />
      <Ink d={l.frontL} fill={ALETA} />
      <Ink d={l.frontR} fill={ALETA} />
    </Frame>
  );
}

export const CHARACTERS = [
  { id: 'carpintero', name: 'Carpintero', Component: Carpintero },
  { id: 'castor', name: 'Castor', Component: Castor },
  { id: 'trucha', name: 'Trucha', Component: Trucha },
  { id: 'leon-marino', name: 'León marino', Component: LeonMarino },
] as const;

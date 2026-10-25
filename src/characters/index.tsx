import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
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

// ---------------------------------------------------------------- Albatros (de ceja negra)
// De perfil, con cuerpo de ave: alas largas plegadas sobre el lomo (la punta pasa la cola),
// pico largo y ganchudo, y tomando de la bombilla del mate que tiene adelante.
const ALBATROS = {
  body: 'M24 130C24 104 50 92 82 92C100 92 112 96 120 102C128 88 138 80 150 80C166 80 176 92 174 106C172 118 162 124 152 126C146 140 136 156 116 162C102 168 88 168 74 168C44 168 24 154 24 130Z',
  wing: 'M124 106C104 98 70 98 42 108C30 112 16 114 8 112C16 124 34 132 58 136C88 140 112 132 126 120C130 114 129 108 124 106Z',
  tail: 'M30 126L10 132L16 144L34 140Z',
  beak: 'M166 96C176 98 186 104 192 112C196 118 194 126 189 126C188 121 185 119 181 118C176 116 170 114 165 112C162 107 162 100 166 96Z',
  hook: 'M184 110C191 113 196 120 194 127C192 131 188 130 187 126C187 122 185 119 182 117Z',
  footL: 'M53 184C55 178 61 175 66 175C71 175 77 178 79 184C75 182 71 183 66 184C61 183 57 182 53 184Z',
  footR: 'M87 184C89 178 95 175 100 175C105 175 111 178 113 184C109 182 105 183 100 184C95 183 91 182 87 184Z',
};
const WING = '#45423F';

export function Albatros({ size }: Props) {
  const a = ALBATROS;
  return (
    <Frame size={size}>
      <G transform="translate(2 -22) scale(0.95)">
        <Sticker silhouette={[a.tail, a.wing, a.body, a.beak, a.hook, a.footL, a.footR, ...mateSilhouette(172, 162)]} />
        {/* Patas palmeadas */}
        <Line d="M68 166L66 178M100 166L100 178" w={4} color="#D99C90" />
        <Ink d={a.footL} fill="#EDB3A6" w={2.4} />
        <Ink d={a.footR} fill="#EDB3A6" w={2.4} />
        <Ink d={a.tail} fill={WING} />
        <Ink d={a.body} fill="#FBF8F1" />
        <Path d="M40 148C56 160 86 164 112 156" fill="none" stroke="#ECE6DA" strokeWidth={8} strokeLinecap="round" />
        {/* Ala larga plegada sobre el lomo */}
        <Ink d={a.wing} fill={WING} />
        <Line d="M30 118C52 126 80 128 104 122" w={2} color="#6B6762" />
        <Line d="M46 112L38 124M62 108L56 126M78 106L74 127M94 106L92 126" w={1.6} color="#5C5853" />
        {/* Cabeza: nuca gris, ceja negra, ojito feliz */}
        <Path d="M128 96C130 86 138 80 148 80C140 84 134 90 134 100Z" fill="#E4E0DA" />
        <Line d="M137 92Q150 83 163 90" w={5} color="#4A4642" />
        <HappyEye x={150} y={97} />
        <Cheek x={155} y={113} />
        {/* Pico largo y ganchudo */}
        <Ink d={a.beak} fill="#F2B33D" />
        <Line d="M170 98C176 100 181 103 184 106" w={1.5} color="#C98A2A" />
        <Line d="M167 105C175 108 183 112 189 117" w={1.5} color="#B87822" />
        <Ink d={a.hook} fill="#E0832F" w={2.4} />
        <MateProp x={172} y={162} />
      </G>
    </Frame>
  );
}

export const CHARACTERS = [
  { id: 'carpintero', name: 'Carpintero', Component: Carpintero },
  { id: 'castor', name: 'Castor', Component: Castor },
  { id: 'trucha', name: 'Trucha', Component: Trucha },
  { id: 'albatros', name: 'Albatros', Component: Albatros },
] as const;

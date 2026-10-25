# Fueguino — contexto del proyecto

App móvil (Expo / React Native) para registrar el **mate** que tomás en el día, al estilo de la app *Waterllama* pero con temática matera y fueguina. La mascota es **Fueguino**, un pingüino de Magallanes. Idioma de la interfaz: español rioplatense (voseo: "tomá", "probá", "elegí").

Publicada para pruebas en GitHub Pages: https://lnausan.github.io/fueguino (repo `lnausan/fueguino`). Cada push a `main` despliega solo (`.github/workflows/deploy-web.yml`).

> Regla del dueño: en commits, archivos, comentarios o repos **nunca** agregar firmas, co-autorías ni menciones a asistentes de IA. Los commits van a nombre de Leo (`lnausan`).

---

## Stack y versiones (no cambiar sin revisar compatibilidad)

- Expo SDK **58** (`expo ~58.0.19`), React Native 0.88, React 19.3, TypeScript 6.
- `react-native-reanimated 4.7.1` + `react-native-worklets 0.13.0` → animaciones y física en el hilo de UI.
- `react-native-svg 15.16.0` → todos los dibujos (mates, vasos, siluetas, ondas, cáusticas).
- `expo-image` (animaciones WebP de Fueguino, componente `Clip` en `ui/kit`).
- `expo-audio` (efectos de sonido) y `expo-haptics` (vibración), ambos incluidos en Expo Go.
- `expo-screen-orientation` (bloqueo vertical), `react-native-safe-area-context`, `expo-font` + `@expo-google-fonts/fredoka` y `@expo-google-fonts/nunito`.
- Web: `react-native-web` + `react-dom`. `app.json` tiene `experiments.baseUrl: "/fueguino"` para Pages.
- Instalar paquetes con `npx expo install <paquete>` (resuelve la versión compatible con SDK 58).
- Expo cambia mucho entre versiones: consultar https://docs.expo.dev/versions/v58.0.0/ antes de usar una API.

**NO se usa Expo Router.** La navegación es un router propio en memoria (ver abajo).

## Comandos

```bash
npm install
npx expo start            # dev server (Expo Go en el celular, misma cuenta Expo en iOS)
npx expo start --web      # navegador
npx tsc --noEmit          # chequeo de tipos (correr antes de dar algo por terminado)
npx expo export -p web    # build estático en dist/ (lo que publica Pages)
```

## Estructura

```
App.tsx                 Carga fuentes, bloquea vertical, Router de pantallas con FadeIn
index.ts                Entrada
scripts/generate-sounds.py  Genera assets/sounds/ (python3 scripts/generate-sounds.py)
app.json                Config Expo (nombre Fueguino, fondo #6c7a36, baseUrl /fueguino)
assets/
  fueguino-clasico.png  Pingüino mascota (pose clásica) → PENGUIN
  fueguino.png          Pingüino relajado de playa, con gafas → PENGUIN_BEACH (hoy sin uso)
  videos/               Animaciones de Fueguino (baile, sombrero): .webp animado con transparencia (lo que usa la app),
                        .webm transparente y -vista.mp4 con fondo (no se usan en la app)
  characters/           Personajes exportados en SVG (carpintero, castor, trucha, albatros)
  sounds/               Efectos WAV: sorbos reales CC0 (sorbo, sorbo1-4; ver CREDITOS.md) y sintetizados (pop, festejo)
  fueguino-sombra.png   Sombra del pingüino de playa (era de la pileta; hoy sin uso)
src/
  store.tsx             Estado global (Context) + navegación
  theme.ts              Colores, fuentes, bebidas, yerbateras/marcas
  sound.ts              Sonidos (`play`, `loopVolume`, `tap`) y vibración (`haptic`)
  i18n.ts               Idiomas (es / pt / en) y textos traducidos (`T[lang]`)
  Scene.tsx             Pantalla inicial: mate sobre yerba con física por inclinación
  YerbaBed.tsx          Fondo de yerba (mosaico SVG de 200 px), red de luz animada (Caustics) y tinte de agua (YerbaTint)
  yerba.ts              Generador de hojitas y palitos + random con semilla (mulberry32)
  caustics.ts           Generador de red Voronoi para la red de luz
  Ripples.tsx           26 ondas en el agua del mate (SVG animado)
  Mate.tsx              Mate visto desde arriba (calabaza, virola, yerba, bombilla) + sombra + contorno de choque
  PenguinRing.tsx       Ronda de 12 personajes puestos a mano (`RONDA`: quién, posición, tamaño, giro, espejado; `SHAPE` con las medidas de cada dibujo), con saltito en ola al chocar
  characters/           Personajes en SVG (react-native-svg), estilo Fueguino: parts.tsx (borde de sticker, mate,
                        ojitos, cachetes) e index.tsx (Carpintero, Castor, Trucha, Albatros + lista CHARACTERS)
  ui/kit.tsx            Componentes compartidos (botones, íconos, Bob, Pulse, Silhouette…)
  ui/silhouette.ts      Contorno (80 puntos) de fueguino-clasico para la silueta que se llena
  ui/Vessel.tsx         Recipiente arrastrable para cargar una bebida
  screens/Onboarding.tsx  Intro, Primer, Recordatorios, Meta, Beneficios, Calculo, Pro
  screens/Home.tsx        Pantalla principal
  screens/Personajes.tsx  Galería de personajes (id `personajes`)
  screens/Yerbas.tsx      Desafío "Ruta de la yerba": Desafio, Catalogo, Puntuar, Ranking
```

## Navegación y estado (`src/store.tsx`)

`useStore()` expone:
- `screen`, `go(id)`, `back()` (pila de historial). IDs de pantalla, en orden de flujo:
  `pool → intro → primer → recordatorios → meta → beneficios → calculo → pro → home`, y desde home: `yerbas → catalogo → puntuar → ranking`.
- `lang` (`'es' | 'pt' | 'en'`, default `'es'`) + `setLang()`.
- `unit` (`'ml' | 'oz'`), `goal` (meta diaria, default 1000 ml).
- `drinks: {kind, amount}[]` + `addDrink()`.
- `catas: {id, score, attrs, tags, note}[]` + `saveCata()` (reemplaza por id).
- `selected` (marca elegida, default `'taragui'`) + `select()`.

⚠️ Todo vive **en memoria**: al recargar se pierde. Pendiente: persistir con AsyncStorage.

En desarrollo y en la web, `?screen=<id>` abre directo esa pantalla (ej. `localhost:8081/?screen=personajes`).

Para agregar una pantalla: sumar el id al tipo en `store.tsx`, crear el componente y registrarlo en el objeto `screens` de `App.tsx`.

## Tema (`src/theme.ts`)

- `C` colores, `F` nombres de fuentes (Fredoka para títulos, Nunito para texto).
- `DRINKS`: `amargo`, `dulce`, `terere`, `cocido`, `agua` — cada uno con `color`, `ink`, `tint`, `shape` (`gourd` mate / `glass` vaso / `mug` taza) y texto.
- `YERBATERAS`: 20 empresas y sus **26 marcas** argentinas (Playadito, Las Marías → Taragüí/Unión/La Merced/Mañanita, CBSé, Amanda, Verdeflor, Rosamonte, Nobleza Gaucha, Cruz de Malta, Aguantadora, Pampa, Sinceridad, La Tranquera, Piporé, Andresito, Cachamate, Romance, Primicia, Buen Día, La Hoja, Más Sabor, La Cumbrecita, Natura, Mate Rojo). `MARCAS` es la lista plana con ids slug. Los paquetes se dibujan genéricos (`PackTile`), **sin logos reales**.
- `FREE_CATAS = 3`: las primeras 3 catas son gratis, el resto pide Pro.

## Pantallas

1. **Inicio (`Scene.tsx`, id `pool`)** — un **mate visto desde arriba** sobre una cama de **yerba**, con red de luz y ondas como una pileta, rodeado por una **ronda de mateada**: 4 Fueguinos y 2 de cada personaje (carpintero, castor, trucha, albatros), alternados sin dos iguales al lado, de 3 tamaños, desparejos, algunos cortados por el borde, la fila de abajo sentada sobre el botón. Al inclinar el teléfono el mate se desliza:
   - Sensor de orientación de Reanimated (gravedad hacia abajo en ambas plataformas). `pitch = atan2(-gz,-gy)`, `roll = atan2(gx, hypot(gy,gz))`.
   - Todo corre en `useFrameCallback` (hilo UI): zona muerta de 3° con entrada suave, el "nivel cero" sigue la mano (τ≈3.3 s), arrastre de la yerba, rebote contra los bordes de la pantalla según el contorno del mate (calabaza + bombilla, `MATE_OUTLINE`) y contra el cuerpo de cada pingüino (un círculo por pingüino; chocan la boca del mate y dos puntos de la bombilla), resorte de aplastamiento, giro de hasta 30° sobre el centro de la boca, ondas al moverse. Al chocar, los pingüinos cercanos saltan en ola desde el punto del golpe.
   - En web usa `DeviceOrientationEvent` (en iOS Safari pide permiso al tocar el botón).
   - Botón **"Inicio"** → pide permiso web y va a `intro`.
2. **Intro** tiene el selector de idioma (🇦🇷 Español · 🇧🇷 Português · 🇺🇸 English); cambia el título y el botón. **Intro, Primer (primer mate), Recordatorios, Meta, Beneficios, Calculo, Pro** — onboarding animado (pingüino que flota con `Bob`, botones con `Pulse`). En Meta cruza la pantalla **Fueguino con sombrero** (`FUEGUINO_SOMBRERO`), sobre un fondo de mates flotando; las opciones se mueven para invitar a tocarlas. Pro tiene tarjetas de planes; los precios son placeholders `[PRECIO]`.
3. **Home** — total del día en grande, silueta gris de Fueguino que se **llena con capas de color** (una por bebida, la última crece animada con superficie ondulada). Fila de bebidas: al tocar una se abre `Vessel` (arrastrás para elegir cantidad; botones y máximo según la bebida en `SIZES`: mates por termo —medio termo 500, termo 1 L, termo grande 1,5 L—, tereré hasta jarra de 2 L, cocido por taza, agua por vaso/botella; hielo en tereré). Aparece un "+N". Al llegar a la meta aparece **Fueguino bailando** (`FUEGUINO_BAILE`) tapando la silueta. Debajo, tarjetas de desafíos: "Ruta de la yerba" (activa) y dos "PRONTO".
4. **Yerbas**
   - *Desafío*: camino de catas, 3 gratis.
   - *Catálogo*: buscador, filtros, candados y hoja de paywall.
   - *Puntuar*: 1–5 mates, segmentos de atributos, etiquetas, nota, overlay de guardado.
   - *Ranking*: podio + lista.

## Sonido y vibración (`src/sound.ts`)

- Botones de `ui/kit` (Pill, LinkText, RoundBtn; el botón Inicio no suena), selector de idioma y filas de la Meta: **pop** + vibración cortita (`tap()`).
- Inicio: **sin sonido** (en el celular no queda bien); solo vibra al chocar el mate, según la fuerza (la física avisa con `scheduleOnRN`, máx. una cada 90 ms).
- Vessel: **sorbos** reales de bombilla (`sip()`, 4 variantes al azar, uno cada 420 ms) mientras sube el nivel o al tocar un chip, tic de vibración cada 100 ml, **sorbo** al confirmar.
- **Festejo** + vibración de éxito al cebar el primer mate y al llegar a la meta en Home.
- Respetan el modo silencio del celular (`playsInSilentMode: false`) y se mezclan con la música. En web suenan recién después del primer toque.

## Convenciones

- Todo lo visual en código (SVG + Reanimated); nada de librerías de UI.
- Animaciones con worklets / shared values, no `setState` por frame.
- Textos en español con voseo. Los textos traducidos viven en `src/i18n.ts`.
- Probar en web y en Expo Go antes de pushear.

## Pendientes / ideas

- Traducir al portugués y al inglés el resto de las pantallas (hoy solo Intro); guardar el idioma elegido.

- Persistencia (AsyncStorage).
- Silueta del Home más fiel al contorno del pingüino.
- Verificar el signo de la inclinación en un dispositivo real.
- Precios reales en Pro, notificaciones reales en Recordatorios.

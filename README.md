# Fueguino · Pantalla inicial (Expo SDK 58 + Expo Go)

Un mate visto desde arriba sobre una cama de yerba, rodeado de pingüinos Fueguino.
Se mueve inclinando el teléfono (sensor de gravedad → pitch/roll calibrados), con
resistencia de la yerba, rebotes contra los pingüinos (que saltan al golpe),
aplastamiento al chocar, giro, red de luz y ondas como en una pileta.

## Cómo abrirlo en tu teléfono

1. Instalá **Node.js LTS** en tu computadora (https://nodejs.org) si todavía no lo tenés.
2. Instalá **Expo Go** en el teléfono (App Store o Google Play) y actualizalo a la última versión (SDK 58).
3. En la Terminal, dentro de esta carpeta:

   ```bash
   npm install
   npx expo login        # solo iPhone: Expo Go para SDK 57+ pide la misma cuenta en ambos lados
   npx expo start
   ```

4. Con el teléfono en **la misma red Wi-Fi** que la computadora:
   - **iPhone:** iniciá sesión en Expo Go con la misma cuenta y escaneá el QR con la Cámara.
   - **Android:** abrí Expo Go y tocá "Scan QR code".

Si la Wi-Fi no deja conectar (redes de oficina o institucionales), usá `npx expo start --tunnel`.

## Probar en la computadora

`npx expo start` y apretá `w`: se abre en el navegador. Mantené apretado el clic sobre la yerba
y el mate se desliza hacia el puntero (en la compu no hay sensor de inclinación).

## Versión web publicada (GitHub Pages)

Cada `push` a la rama `main` publica la versión web automáticamente
(`.github/workflows/deploy-web.yml`). Queda en `https://<tu-usuario>.github.io/fueguino/`.

- Primera vez: en el repositorio, **Settings → Pages → Source: GitHub Actions**.
- Abierta desde el celular, la inclinación usa el giroscopio del navegador.
  En iPhone, Safari pide permiso al primer toque.
- Si cambiás el nombre del repositorio, actualizá `experiments.baseUrl` en `app.json`.

## Dónde está cada cosa

- `src/Scene.tsx`: física (inclinación, calibración, zona muerta, arrastre, rebotes, aplastamiento, giro) y ondas.
- `src/YerbaBed.tsx` y `src/yerba.ts`: fondo de yerba (hojitas y palitos), red de luz (cáusticas, `src/caustics.ts`) y tinte del agua.
- `src/Ripples.tsx`: ondas onduladas con borde brillante y franja oscura.
- `src/Mate.tsx`: el mate visto desde arriba, su sombra y su contorno para los choques.
- `src/PenguinRing.tsx`: la ronda de pingüinos (dónde va cada uno, en `RONDA`) y sus saltitos.
- Los ajustes de la física están al principio de `src/Scene.tsx` (fuerza, resistencia, rebote, etc.).

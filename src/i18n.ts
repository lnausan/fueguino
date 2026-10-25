// Idiomas de la app. Por ahora solo está traducida la pantalla de inicio (Intro);
// para traducir otra pantalla, sumar sus textos acá y leerlos con `T[lang]`.
export type Lang = 'es' | 'pt' | 'en';

export const LANGS: { id: Lang; flag: string; name: string }[] = [
  { id: 'es', flag: '🇦🇷', name: 'Español' },
  { id: 'pt', flag: '🇧🇷', name: 'Português' },
  { id: 'en', flag: '🇺🇸', name: 'English' },
];

export const T: Record<Lang, { introTitle: string; start: string }> = {
  es: { introTitle: 'Llevá la cuenta de tus mates', start: 'EMPEZAR' },
  pt: { introTitle: 'Acompanhe seus mates', start: 'COMEÇAR' },
  en: { introTitle: 'Keep track of every mate', start: 'START' },
};

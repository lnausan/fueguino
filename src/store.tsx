import React, { createContext, useContext, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { DrinkKind } from './theme';
import { Lang } from './i18n';

export type Screen =
  | 'pool' | 'intro' | 'primer' | 'recordatorios' | 'meta' | 'beneficios' | 'calculo' | 'pro'
  | 'home' | 'yerbas' | 'catalogo' | 'puntuar' | 'ranking' | 'personajes';

export type Drink = { kind: DrinkKind; amount: number };
export type Cata = { id: string; score: number; attrs: Record<string, number>; tags: string[]; note: string };

type Store = {
  screen: Screen;
  go: (s: Screen) => void;
  back: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  unit: 'ml' | 'oz';
  setUnit: (u: 'ml' | 'oz') => void;
  goal: number;
  setGoal: (g: number) => void;
  drinks: Drink[];
  addDrink: (d: Drink) => void;
  catas: Cata[];
  saveCata: (c: Cata) => void;
  selected: string;
  select: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

// Solo en desarrollo y en la web: ?screen=home (o cualquier id) abre directo esa pantalla
function firstScreen(): Screen {
  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined') {
    const s = new URLSearchParams(window.location.search).get('screen');
    if (s) return s as Screen;
  }
  return 'pool';
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<Screen[]>(() => [firstScreen()]);
  const [lang, setLang] = useState<Lang>('es');
  const [unit, setUnit] = useState<'ml' | 'oz'>('ml');
  const [goal, setGoal] = useState(1000);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [catas, setCatas] = useState<Cata[]>([]);
  const [selected, select] = useState('taragui');

  const value = useMemo<Store>(
    () => ({
      screen: history[history.length - 1],
      go: (s) => setHistory((h) => [...h, s]),
      back: () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h)),
      lang, setLang, unit, setUnit, goal, setGoal,
      drinks,
      addDrink: (d) => setDrinks((x) => [...x, d]),
      catas,
      saveCata: (c) => setCatas((x) => [...x.filter((y) => y.id !== c.id), c]),
      selected, select,
    }),
    [history, lang, unit, goal, drinks, catas, selected],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
};

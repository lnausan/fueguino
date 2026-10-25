import React, { createContext, useContext, useMemo, useState } from 'react';
import { DrinkKind } from './theme';

export type Screen =
  | 'pool' | 'intro' | 'primer' | 'recordatorios' | 'meta' | 'beneficios' | 'calculo' | 'pro'
  | 'home' | 'yerbas' | 'catalogo' | 'puntuar' | 'ranking';

export type Drink = { kind: DrinkKind; amount: number };
export type Cata = { id: string; score: number; attrs: Record<string, number>; tags: string[]; note: string };

type Store = {
  screen: Screen;
  go: (s: Screen) => void;
  back: () => void;
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<Screen[]>(['pool']);
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
      unit, setUnit, goal, setGoal,
      drinks,
      addDrink: (d) => setDrinks((x) => [...x, d]),
      catas,
      saveCata: (c) => setCatas((x) => [...x.filter((y) => y.id !== c.id), c]),
      selected, select,
    }),
    [history, unit, goal, drinks, catas, selected],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
};

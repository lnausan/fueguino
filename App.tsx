import { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useFonts, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import Scene from './src/Scene';
import { StoreProvider, useStore } from './src/store';
import { initSound } from './src/sound';
import { Beneficios, Calculo, Intro, Meta, Primer, Pro, Recordatorios } from './src/screens/Onboarding';
import { Home } from './src/screens/Home';
import { YerbasCatalogo, YerbasDesafio, YerbasPuntuar, YerbasRanking } from './src/screens/Yerbas';
import { Personajes } from './src/screens/Personajes';

function Router() {
  const { screen, go } = useStore();
  const screens = {
    pool: <Scene onStart={() => go('intro')} />,
    intro: <Intro />,
    primer: <Primer />,
    recordatorios: <Recordatorios />,
    meta: <Meta />,
    beneficios: <Beneficios />,
    calculo: <Calculo />,
    pro: <Pro />,
    home: <Home />,
    yerbas: <YerbasDesafio />,
    catalogo: <YerbasCatalogo />,
    puntuar: <YerbasPuntuar />,
    ranking: <YerbasRanking />,
    personajes: <Personajes />,
  };
  return (
    <Animated.View key={screen} entering={FadeIn.duration(300)} style={{ flex: 1 }}>
      <StatusBar style={screen === 'pool' || screen === 'meta' ? 'light' : 'dark'} />
      {screens[screen]}
    </Animated.View>
  );
}

export default function App() {
  const [loaded] = useFonts({ Fredoka_600SemiBold, Fredoka_700Bold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });

  useEffect(() => {
    // Bloqueado en vertical (además de "orientation": "portrait" en app.json)
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    initSound();
  }, []);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: '#6c7a36' }} />;

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Router />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

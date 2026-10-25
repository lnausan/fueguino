import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Scene from './src/Scene';

export default function App() {
  useEffect(() => {
    // Bloqueado en vertical (además de "orientation": "portrait" en app.json)
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Scene />
    </SafeAreaProvider>
  );
}

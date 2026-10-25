import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, PENGUIN } from '../theme';
import { CHARACTERS } from '../characters';

/** Galería de personajes (para revisarlos; se abre con ?screen=personajes en desarrollo). */
export function Personajes() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const size = Math.floor((width - 48) / 2);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40, paddingHorizontal: 16 }}>
      <Text style={styles.title}>Personajes</Text>
      <View style={styles.grid}>
        <View style={[styles.card, { width: size }]}>
          <Image source={PENGUIN} style={{ width: size - 16, height: size - 16 }} />
          <Text style={styles.name}>Fueguino</Text>
        </View>
        {CHARACTERS.map(({ id, name, Component }) => (
          <View key={id} style={[styles.card, { width: size }]}>
            <Component size={size - 16} />
            <Text style={styles.name}>{name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: F.title, fontSize: 28, color: C.ink, textAlign: 'center', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { alignItems: 'center', backgroundColor: C.sand, borderRadius: 20, paddingVertical: 8 },
  name: { fontFamily: F.heavy, fontSize: 14, color: C.muted, marginTop: 2 },
});

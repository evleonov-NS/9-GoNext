import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddSheet } from '@/components/AddSheet';
import { useAddSheet } from '@/components/AddSheetContext';
import { IconPath } from '@/components/IconPath';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { NAV_ICONS } from '@/constants/categories';
import { radii, type AppColors } from '@/constants/theme';

type TabKey = 'index' | 'want' | 'trips' | 'places';

const TABS: { name: TabKey; label: string; icon: keyof typeof NAV_ICONS }[] = [
  { name: 'index', label: 'Главная', icon: 'home' },
  { name: 'want', label: 'Хочу', icon: 'want' },
  { name: 'trips', label: 'Поездки', icon: 'trips' },
  { name: 'places', label: 'Места', icon: 'places' },
];

function FloatingFab() {
  const { open } = useAddSheet();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      style={[styles.fab, { bottom: 100 + Math.max(insets.bottom - 10, 0) }]}
      onPress={open}
      accessibilityLabel="Что добавить"
    >
      <Text style={styles.fabText}>+</Text>
    </Pressable>
  );
}

function PrototypeTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabBarWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const route = state.routes.find((r) => r.name === tab.name);
          if (!route) return null;
          const routeIndex = state.routes.indexOf(route);
          const focused = state.index === routeIndex;
          const color = focused ? colors.accent : colors.textSecondary;
          const bg = focused ? colors.accentMuted : 'transparent';

          return (
            <Pressable
              key={tab.name}
              style={[styles.tabItem, { backgroundColor: bg }]}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(tab.name);
                }
              }}
            >
              <IconPath d={NAV_ICONS[tab.icon]} size={21} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { visible, close } = useAddSheet();
  const [mounted, setMounted] = useState(false);
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Tabs
        tabBar={(props) => <PrototypeTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: 'Главная' }} />
        <Tabs.Screen name="want" options={{ title: 'Хочу' }} />
        <Tabs.Screen name="trips" options={{ title: 'Поездки' }} />
        <Tabs.Screen name="places" options={{ title: 'Места' }} />
      </Tabs>
      {mounted ? <FloatingFab /> : null}
      <AddSheet visible={visible} onClose={close} />
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  root: {
    flex: 1,
  },
  tabBarWrap: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 0,
  },
  tabBar: {
    height: 76,
    backgroundColor: colors.tabBarBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    flexDirection: 'row',
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: radii.fab,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
    zIndex: 15,
  },
  fabText: {
    color: colors.textOnAccent,
    fontSize: 27,
    lineHeight: 30,
    fontWeight: '400',
  },
  });
}

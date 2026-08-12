import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  /** Отступ снизу под плавающий tab bar + FAB */
  tabBarPadding?: boolean;
};

export function Screen({
  children,
  scroll = true,
  contentStyle,
  tabBarPadding = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = tabBarPadding ? 110 + insets.bottom : 24 + insets.bottom;

  const body = (
    <View
      style={[
        styles.inner,
        { paddingTop: 26 + insets.top, paddingBottom: bottomPad },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  if (!scroll) {
    return <View style={styles.root}>{body}</View>;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {body}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    paddingHorizontal: 18,
  },
});

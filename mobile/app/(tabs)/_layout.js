import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/icons';
import { useFinance } from '../../src/FinanceContext';
import { COLORS } from '../../src/theme';

const icons = { index: 'home', budgets: 'budgets', add: 'add', goals: 'goals', more: 'more' };
const labels = { index: 'Home', budgets: 'Budgets', add: 'Add transaction', goals: 'Goals', more: 'More' };

export default function TabLayout() {
  const { user } = useFinance();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => {
        const icon = icons[route.name] || 'home';
        return {
          headerShown: false,
          tabBarAccessibilityLabel: labels[route.name] || route.name,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.tabInactive,
          tabBarStyle: {
            height: 58 + insets.bottom,
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 7),
            borderTopColor: COLORS.border,
            backgroundColor: COLORS.white,
            elevation: 10,
            display: user ? 'flex' : 'none',
          },
          tabBarItemStyle: { paddingTop: 1 },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
          tabBarIcon: ({ color, size }) => route.name === 'add'
            ? <View style={styles.addAction}><AppIcon name={icon} color={COLORS.white} size={22} strokeWidth={2.6} /></View>
            : <AppIcon name={icon} color={color} size={size} strokeWidth={2.2} />,
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="budgets" options={{ title: 'Budgets' }} />
      <Tabs.Screen name="add" options={{ title: 'Add' }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addAction: {
    width: 38,
    height: 38,
    marginTop: -6,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

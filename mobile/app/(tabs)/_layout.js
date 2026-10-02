import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/icons';
import { useFinance } from '../../src/FinanceContext';
import { COLORS } from '../../src/theme';
import { useTheme } from '../../src/ThemeContext';

const icons = { index: 'home', budgets: 'budgets', add: 'add', goals: 'goals', more: 'more' };
const labels = { index: 'Home', budgets: 'Budgets', add: 'Add transaction', goals: 'Goals', more: 'More' };

export default function TabLayout() {
  const { user, loading, error, onboardingStatus } = useFinance();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (user && !loading && !error && ['not_started', 'in_progress'].includes(onboardingStatus)) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={({ route }) => {
        const icon = icons[route.name] || 'home';
        return {
          headerShown: false,
          tabBarAccessibilityLabel: labels[route.name] || route.name,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            height: 64 + insets.bottom,
            paddingTop: 5,
            paddingBottom: Math.max(insets.bottom, 5),
            borderTopColor: colors.border,
            backgroundColor: colors.white,
            elevation: 10,
            display: user ? 'flex' : 'none',
          },
          tabBarItemStyle: { paddingTop: 1 },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
          tabBarIcon: ({ color, size }) => route.name === 'add'
            ? <View style={[styles.addAction, { backgroundColor: colors.primary }]}><AppIcon name={icon} color={colors.onPrimary} size={22} strokeWidth={2.6} /></View>
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
    width: 50,
    height: 50,
    marginTop: -18,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

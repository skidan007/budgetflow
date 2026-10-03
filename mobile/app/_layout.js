import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FinanceProvider, useFinance } from '../src/FinanceContext';
import { ThemeProvider, useTheme } from '../src/ThemeContext';
import { BudgetFlowLogo } from '../components/ui/BudgetFlowLogo';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider><FinanceProvider><RootNavigation /></FinanceProvider></ThemeProvider></SafeAreaProvider>;
}

function RootNavigation() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [minimumSplashElapsed, setMinimumSplashElapsed] = useState(false);
  const { colors, isDark } = useTheme();
  const { authReady, loading } = useFinance();

  useEffect(() => {
    if (__DEV__ && authReady && !loading) console.info('[BudgetFlow Startup] App ready');
  }, [authReady, loading]);

  useEffect(() => {
    const timer = setTimeout(() => setMinimumSplashElapsed(true), 360);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  if (!authReady || !minimumSplashElapsed) {
    return <><StatusBar style="light" backgroundColor="#0B0F17" /><StartupBrandSplash /></>;
  }

  return <><StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} /><Stack screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'default', contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="onboarding" /><Stack.Screen name="budget/[id]" /><Stack.Screen name="goal/[id]" /><Stack.Screen name="transactions" /><Stack.Screen name="planner" /><Stack.Screen name="reports" /><Stack.Screen name="account" /><Stack.Screen name="settings" /><Stack.Screen name="profile" /><Stack.Screen name="compound-interest" /></Stack></>;
}

function StartupBrandSplash() {
  return (
    <View style={styles.startupSplash}>
      <BudgetFlowLogo size={176} />
      <Text style={styles.startupBrandText}>BudgetFlow</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  startupSplash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24, backgroundColor: '#0B0F17' },
  startupBrandText: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
});

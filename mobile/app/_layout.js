import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FinanceProvider } from '../src/FinanceContext';
import { ThemeProvider, useTheme } from '../src/ThemeContext';

export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider><FinanceProvider><RootNavigation /></FinanceProvider></ThemeProvider></SafeAreaProvider>;
}

function RootNavigation() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const { colors, isDark } = useTheme();

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

  return <><StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} /><Stack screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'default', contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="budget/[id]" /><Stack.Screen name="goal/[id]" /><Stack.Screen name="transactions" /><Stack.Screen name="planner" /><Stack.Screen name="reports" /><Stack.Screen name="settings" /><Stack.Screen name="profile" /><Stack.Screen name="compound-interest" /></Stack></>;
}

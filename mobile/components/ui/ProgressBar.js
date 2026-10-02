import { AccessibilityInfo, Animated, StyleSheet, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { COLORS, RADIUS } from "../../src/theme";
import { useTheme } from "../../src/ThemeContext";

export function ProgressBar({
  value,
  label,
  accessibilityValueText,
  color = COLORS.primary,
  trackColor = COLORS.mutedTint,
  style,
}) {
  const { colors } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const progress = Math.max(0, Math.min(Number(value) || 0, 100));
  const animatedWidth = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduceMotion(value);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      animatedWidth.setValue(progress);
      return;
    }
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [animatedWidth, progress, reduceMotion]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: progress,
        text: accessibilityValueText ?? `${Math.round(progress)} percent`,
      }}
      style={[styles.track, { backgroundColor: trackColor === COLORS.mutedTint ? colors.mutedTint : trackColor }, style]}
    >
      <Animated.View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[styles.fill, { width: animatedWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), backgroundColor: color }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    height: 8,
    borderRadius: RADIUS.pill,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: RADIUS.pill },
});

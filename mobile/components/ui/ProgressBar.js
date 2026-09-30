import { StyleSheet, View } from "react-native";
import { COLORS, RADIUS } from "../../src/theme";

export function ProgressBar({
  value,
  label,
  accessibilityValueText,
  color = COLORS.primary,
  trackColor = COLORS.mutedTint,
  style,
}) {
  const progress = Math.max(0, Math.min(Number(value) || 0, 100));

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
      style={[styles.track, { backgroundColor: trackColor }, style]}
    >
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[styles.fill, { width: `${progress}%`, backgroundColor: color }]}
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

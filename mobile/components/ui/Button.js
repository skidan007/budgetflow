import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { COLORS, CONTROL, RADIUS, SHADOW, SPACE, TEXT } from "../../src/theme";
import { useTheme } from "../../src/ThemeContext";

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  accessibilityLabel = title,
  accessibilityHint,
  accessibilityState,
  icon,
  style,
  textStyle,
  testID,
}) {
  const { colors } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const unavailable = disabled || loading;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduceMotion(value);
    });
    return () => { active = false; };
  }, []);

  const variantColors = variant === 'danger'
    ? { backgroundColor: colors.danger, borderColor: colors.danger }
    : variant === 'secondary'
      ? { backgroundColor: colors.purpleTint, borderColor: colors.purpleTint }
      : variant === 'outline'
        ? { backgroundColor: colors.card, borderColor: colors.border }
        : { backgroundColor: colors.primary, borderColor: colors.primary };
  const labelColor = variant === 'secondary' || variant === 'outline' ? colors.accentText : colors.onPrimary;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={unavailable}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ ...accessibilityState, disabled: unavailable, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variants[variant] || variants.primary,
        variantColors,
        unavailable && styles.disabled,
        unavailable && { backgroundColor: colors.mutedTint, borderColor: colors.border },
        pressed && !unavailable && (reduceMotion ? styles.pressedReduced : styles.pressed),
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            accessible={false}
            color={unavailable ? colors.secondaryText : labelColor}
          />
        ) : icon ? <View accessible={false}>{icon}</View> : null}
        <Text style={[styles.label, { color: labelColor }, unavailable && styles.disabledLabel, { color: unavailable ? colors.secondaryText : labelColor }, textStyle]}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: CONTROL.buttonHeight,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.action,
  },
  primary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.purpleTint, borderColor: COLORS.purpleTint, shadowOpacity: 0, elevation: 0 },
  danger: { backgroundColor: COLORS.danger, borderColor: COLORS.danger, shadowColor: COLORS.danger },
  outline: { backgroundColor: COLORS.white, borderColor: COLORS.border, shadowOpacity: 0, elevation: 0 },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACE.sm },
  label: { ...TEXT.button, color: COLORS.white, textAlign: "center", flexShrink: 1 },
  disabled: { backgroundColor: COLORS.mutedTint, borderColor: COLORS.border, shadowOpacity: 0, elevation: 0 },
  disabledLabel: { color: COLORS.secondaryText },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  pressedReduced: { opacity: 0.9 },
});

const variants = {
  primary: styles.primary,
  secondary: styles.secondary,
  danger: styles.danger,
  outline: styles.outline,
};

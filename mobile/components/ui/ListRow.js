import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, CONTROL, SPACE, TEXT } from "../../src/theme";
import { useTheme } from "../../src/ThemeContext";

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  selected,
  titleNumberOfLines = 1,
  divider = true,
  style,
}) {
  const { colors } = useTheme();
  const content = (
    <>
      {leading ? <View accessible={false}>{leading}</View> : null}
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={titleNumberOfLines}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.secondaryText }]} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {trailing ? <View accessible={false}>{trailing}</View> : null}
    </>
  );
  const rowStyle = [styles.row, divider && styles.divider, divider && { borderBottomColor: colors.borderSubtle }, style];

  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || [title, subtitle].filter(Boolean).join(". ")}
      accessibilityHint={accessibilityHint}
      accessibilityState={selected === undefined ? undefined : { selected }}
      style={({ pressed }) => [rowStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  ) : (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      style={rowStyle}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: CONTROL.minTouchTarget + SPACE.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  copy: { flex: 1, gap: SPACE.xs },
  title: { ...TEXT.cardTitle },
  subtitle: { ...TEXT.secondary },
  divider: { borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle },
  pressed: { opacity: 0.82 },
});

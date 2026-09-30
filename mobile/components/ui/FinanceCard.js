import { StyleSheet, View } from "react-native";
import { COLORS, COMPONENT, RADIUS, SHADOW } from "../../src/theme";
import { useTheme } from "../../src/ThemeContext";

export function FinanceCard({ children, style, accessibilityLabel }) {
  const { colors } = useTheme();
  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.card,
    padding: COMPONENT.cardPadding,
    ...SHADOW.card,
  },
});

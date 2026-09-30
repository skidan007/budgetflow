import { StyleSheet, View } from "react-native";
import { COLORS, COMPONENT, RADIUS, SHADOW } from "../../src/theme";

export function FinanceCard({ children, style, accessibilityLabel }) {
  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      style={[styles.card, style]}
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

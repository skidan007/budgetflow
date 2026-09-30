import { StyleSheet, Text, View } from "react-native";
import { SPACE, TEXT } from "../../src/theme";
import { FinanceCard } from "./FinanceCard";
import { useTheme } from "../../src/ThemeContext";

export function StatCard({
  label,
  value,
  detail,
  accessibilityValue,
  icon,
  style,
}) {
  const { colors } = useTheme();
  return (
    <FinanceCard
      style={[styles.card, style]}
      accessibilityLabel={`${label}: ${accessibilityValue ?? value}${detail ? `, ${detail}` : ""}`}
    >
      {icon ? <View accessible={false}>{icon}</View> : null}
      <Text style={[styles.label, { color: colors.secondaryText }]} accessible={false}>
        {label}
      </Text>
      <Text style={[styles.value, { color: colors.text }]} accessible={false}>
        {value}
      </Text>
      {detail ? (
        <Text style={[styles.detail, { color: colors.secondaryText }]} accessible={false}>
          {detail}
        </Text>
      ) : null}
    </FinanceCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACE.xs },
  label: TEXT.label,
  value: TEXT.financialAmount,
  detail: TEXT.secondary,
});

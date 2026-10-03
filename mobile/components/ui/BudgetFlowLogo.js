import { Image, StyleSheet, View } from "react-native";

export function BudgetFlowLogo({ size = 96 }) {
  return (
    <View
      accessible={false}
      style={[
        styles.surface,
        {
          width: size,
          height: size,
          padding: Math.round(size * 0.1),
          borderRadius: Math.round(size * 0.24),
        },
      ]}
    >
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.image}
        resizeMode="contain"
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  image: { width: "100%", height: "100%" },
});
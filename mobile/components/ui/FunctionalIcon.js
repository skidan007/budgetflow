import { StyleSheet, View } from 'react-native';
import { AppIcon, GOAL_ICON_COMPONENTS, ICONS } from '../icons';
import { FUNCTIONAL_ICON_TONES } from '../../src/theme';
import { useTheme } from '../../src/ThemeContext';

const roles = {
  food: 'green', transport: 'blue', bills: 'orange', rent: 'orange', housing: 'orange',
  shopping: 'pink', personal: 'pink', laptop: 'indigo', entertainment: 'purple', emergencyfund: 'purple',
  health: 'red', education: 'indigo', savings: 'teal', investment: 'teal', income: 'green', expense: 'red',
  planner: 'purple', reports: 'blue', compoundinterest: 'green', settings: 'gray', history: 'orange',
  financialprofile: 'blue', business: 'blue', travel: 'green', home: 'indigo', goals: 'teal', balance: 'indigo',
};

export function functionalToneForName(name) {
  const normalized = String(name || '').replace(/([a-z])([A-Z])/g, '$1 $2').trim().toLowerCase();
  return roles[normalized.replace(/\s+/g, '')] || roles[normalized] || (/food|grocery|meal/.test(normalized) ? 'green' : /transport|travel|car/.test(normalized) ? 'blue' : /bill|rent|housing|utility/.test(normalized) ? 'orange' : /shop|laptop|personal/.test(normalized) ? 'pink' : /entertain|fun/.test(normalized) ? 'purple' : /health|emergency/.test(normalized) ? 'red' : /education|school/.test(normalized) ? 'indigo' : /saving|investment|goal/.test(normalized) ? 'teal' : /income|salary|business/.test(normalized) ? 'blue' : 'purple');
}

export function FunctionalIcon({ name, tone, size = 21, containerSize = 48, strokeWidth = 2, style }) {
  const { themeName } = useTheme();
  const role = tone || functionalToneForName(name) || 'gray';
  const colors = FUNCTIONAL_ICON_TONES[role]?.[themeName] || FUNCTIONAL_ICON_TONES.gray[themeName];
  return (
    <View accessible={false} style={[styles.container, { width: containerSize, height: containerSize, borderRadius: Math.round(containerSize * 0.29), backgroundColor: colors.background }, style]}>
      <AppIcon name={name} size={size} color={colors.foreground} strokeWidth={strokeWidth} />
    </View>
  );
}

const goalTones = {
  'Emergency Fund': 'purple', Savings: 'teal', Education: 'indigo', Business: 'blue',
  Travel: 'green', Home: 'orange', Car: 'blue', Technology: 'indigo', Health: 'red', Other: 'purple',
};

export function GoalCategoryIcon({ category, size = 24, containerSize = 48, strokeWidth = 2.4, style }) {
  const { themeName } = useTheme();
  const Icon = GOAL_ICON_COMPONENTS[category] || ICONS.goals;
  const tone = goalTones[category] || 'purple';
  const colors = FUNCTIONAL_ICON_TONES[tone][themeName] || FUNCTIONAL_ICON_TONES.purple.dark;
  return (
    <View
      accessible={false}
      style={[styles.container, {
        width: containerSize,
        height: containerSize,
        borderRadius: Math.round(containerSize * 0.29),
        backgroundColor: colors.background,
      }, style]}
    >
      <Icon size={size} color={colors.foreground} strokeWidth={strokeWidth} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

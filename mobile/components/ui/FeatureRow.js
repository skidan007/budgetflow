import { ChevronRight } from 'lucide-react-native';
import { ListRow } from './ListRow';
import { FunctionalIcon } from './FunctionalIcon';
import { useTheme } from '../../src/ThemeContext';

export function FeatureRow({ title, description, iconName, tone, onPress, accessibilityHint, divider = true }) {
  const { colors } = useTheme();
  return <ListRow
    leading={<FunctionalIcon name={iconName} tone={tone} />}
    title={title}
    subtitle={description}
    trailing={<ChevronRight color={colors.secondaryText} size={20} />}
    onPress={onPress}
    accessibilityLabel={`${title}. ${description}.`}
    accessibilityHint={accessibilityHint || `Opens ${title}`}
    divider={divider}
  />;
}

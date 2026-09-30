export const COLORS = {
  primary: '#5B4BDB',
  navy: '#111827',
  background: '#F5F6FA',
  card: '#FFFFFF',
  text: '#111827',
  secondaryText: '#6B7280',
  positive: '#16A34A',
  positiveText: '#15803D',
  warning: '#F59E0B',
  danger: '#DC2626',
  heroText: '#C7CDE0',
  placeholder: '#737B8B',
  border: '#E5E7EB',
  borderSubtle: '#F0F1F5',
  borderPurple: '#C7BEFF',
  borderPurpleSoft: '#D8D2FF',
  borderPurpleStrong: '#D2CCFF',
  borderDanger: '#FECACA',
  controlBackground: '#ECEEF4',
  noticeBackground: '#FAF9FF',
  tabInactive: '#8B92A2',
  overlayWhite12: 'rgba(255,255,255,.12)',
  overlayWhite14: 'rgba(255,255,255,.14)',
  overlayWhite16: 'rgba(255,255,255,0.16)',
  overlayWhite18: 'rgba(255,255,255,.18)',
  purpleTint: '#F0EEFF',
  greenTint: '#ECFDF3',
  redTint: '#FEF2F2',
  mutedTint: '#F3F4F6',
  white: '#FFFFFF',
};

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, page: 20 };
export const RADIUS = { sm: 10, md: 14, card: 18, pill: 999 };
export const TYPE = {
  display: 32,
  title: 24,
  heading: 17,
  body: 15,
  caption: 12,
  eyebrow: 11,
  small: 12,
  button: 15,
  lineHeight: { body: 22, caption: 17 },
  weight: { regular: '400', medium: '500', semibold: '600', bold: '700', heavy: '800' },
};

export const TEXT = {
  screenTitle: { fontSize: TYPE.title, fontWeight: TYPE.weight.heavy, color: COLORS.text },
  sectionTitle: { fontSize: TYPE.heading, fontWeight: TYPE.weight.bold, color: COLORS.text },
  cardTitle: { fontSize: TYPE.body, fontWeight: TYPE.weight.bold, color: COLORS.text },
  body: { fontSize: TYPE.body, fontWeight: TYPE.weight.regular, color: COLORS.text },
  secondary: { fontSize: TYPE.caption, fontWeight: TYPE.weight.regular, color: COLORS.secondaryText },
  financialAmount: { fontSize: TYPE.display, fontWeight: TYPE.weight.heavy, color: COLORS.text },
  metricAmount: { fontSize: TYPE.title, fontWeight: TYPE.weight.heavy, color: COLORS.text },
  label: { fontSize: TYPE.eyebrow, fontWeight: TYPE.weight.bold, color: COLORS.secondaryText },
  button: { fontSize: TYPE.button, fontWeight: TYPE.weight.bold },
  error: { fontSize: TYPE.body, fontWeight: TYPE.weight.medium, color: COLORS.danger },
  success: { fontSize: TYPE.body, fontWeight: TYPE.weight.semibold, color: COLORS.positiveText },
};

export const CONTROL = { minTouchTarget: 48, inputHeight: 52, buttonHeight: 50 };
export const BORDER = { hairline: 1, standard: 1 };
export const COMPONENT = {
  screenHorizontalPadding: SPACE.page,
  screenVerticalPadding: SPACE.lg,
  cardPadding: SPACE.lg,
  inputPaddingHorizontal: SPACE.md,
};

export const SHADOW = {
  card: {
    shadowColor: COLORS.navy,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  action: {
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};


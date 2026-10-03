export const COLORS = {
  primary: '#6C4DFF',
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

export const THEMES = {
  light: { ...COLORS, background: '#F5F6FA', card: '#FFFFFF', white: '#FFFFFF', onPrimary: '#FFFFFF', accentText: '#5B4BDB', inputBackground: '#FFFFFF', text: '#111827', navy: '#111827', secondaryText: '#596273', placeholder: '#687184', border: '#E1E4EB', borderSubtle: '#ECEEF3', controlBackground: '#E9EBF2', noticeBackground: '#F7F5FF', tabInactive: '#70798A', purpleTint: '#F0EEFF', greenTint: '#EAF8EF', redTint: '#FCEEEE', mutedTint: '#F1F2F6', positive: '#15803D', positiveText: '#166534', danger: '#B42332', warning: '#A65B00', divider: '#ECEEF3', elevated: '#FFFFFF', overlay: 'rgba(17,24,39,0.42)', chartGrid: '#ECEEF3', chartLabel: '#596273', accessibleText: '#111827' },
  dark: { ...COLORS, primary: '#6C4DFF', background: '#0B0F17', card: '#171E2A', white: '#171E2A', onPrimary: '#FFFFFF', accentText: '#B8ACFF', inputBackground: '#0F141D', text: '#F8FAFC', navy: '#111827', secondaryText: '#A7B0C0', placeholder: '#9AA3B4', border: '#2A3445', borderSubtle: '#253043', controlBackground: '#111827', noticeBackground: '#14261E', tabInactive: '#98A4B8', purpleTint: '#292246', greenTint: '#153326', redTint: '#382129', mutedTint: '#263143', positive: '#22C55E', positiveText: '#34D399', danger: '#EF4444', warning: '#F59E0B', heroText: '#E8E4FF', borderPurple: '#62599B', borderPurpleSoft: '#494265', borderPurpleStrong: '#62599B', borderDanger: '#74414A', overlayWhite12: 'rgba(255,255,255,.08)', overlayWhite14: 'rgba(255,255,255,.10)', overlayWhite16: 'rgba(255,255,255,.12)', overlayWhite18: 'rgba(255,255,255,.14)', divider: '#253043', elevated: '#1D2635', overlay: 'rgba(0,0,0,0.72)', chartGrid: '#343B49', chartLabel: '#A7B0C0', accessibleText: '#F8FAFC' },
};

export const FUNCTIONAL_ICON_TONES = {
  green: { light: { foreground: '#137A48', background: '#E8F6ED' }, dark: { foreground: '#64D995', background: '#17372A' } },
  blue: { light: { foreground: '#2563A6', background: '#E9F2FC' }, dark: { foreground: '#79B8FF', background: '#1C3047' } },
  orange: { light: { foreground: '#A84F0A', background: '#FFF1E4' }, dark: { foreground: '#FFB86B', background: '#402D1C' } },
  pink: { light: { foreground: '#B83270', background: '#FCEAF2' }, dark: { foreground: '#FF8FC2', background: '#402237' } },
  purple: { light: { foreground: '#6448C8', background: '#F0ECFF' }, dark: { foreground: '#B9A6FF', background: '#30294A' } },
  red: { light: { foreground: '#B42332', background: '#FCEBED' }, dark: { foreground: '#FF858B', background: '#40242A' } },
  indigo: { light: { foreground: '#4853B8', background: '#ECEEFF' }, dark: { foreground: '#A6ADFF', background: '#292E4A' } },
  teal: { light: { foreground: '#087E82', background: '#E3F5F2' }, dark: { foreground: '#5ED8C5', background: '#173A3A' } },
  gray: { light: { foreground: '#596273', background: '#EEF0F4' }, dark: { foreground: '#B0B8C8', background: '#2A303C' } },
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

export const CONTROL = { minTouchTarget: 48, inputHeight: 48, buttonHeight: 50 };
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

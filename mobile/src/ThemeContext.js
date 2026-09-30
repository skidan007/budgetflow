import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, THEMES } from './theme';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'appearanceTheme';

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => { if (active && (saved === 'light' || saved === 'dark')) setThemeName(saved); })
      .catch(() => {})
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const setTheme = useCallback(async (next) => {
    if (next !== 'light' && next !== 'dark') return;
    setThemeName(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);
  const value = useMemo(() => ({ themeName, isDark: themeName === 'dark', colors: THEMES[themeName], setTheme }), [themeName, setTheme]);

  useEffect(() => { Object.assign(COLORS, value.colors); }, [value.colors]);
  if (!ready) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext) || { themeName: 'dark', isDark: true, colors: THEMES.dark, setTheme: async () => {} };
}

const lightColorMap = {
  '#F5F6FA': 'background', '#FFFFFF': 'white', '#111827': 'text', '#6B7280': 'secondaryText', '#737B8B': 'placeholder', '#6C4DFF': 'primary',
  '#E5E7EB': 'border', '#F0F1F5': 'borderSubtle', '#ECEEF4': 'controlBackground', '#FAF9FF': 'noticeBackground', '#8B92A2': 'tabInactive',
  '#F0EEFF': 'purpleTint', '#ECFDF3': 'greenTint', '#FEF2F2': 'redTint', '#F3F4F6': 'mutedTint', '#16A34A': 'positive',
  '#15803D': 'positiveText', '#DC2626': 'danger', '#F59E0B': 'warning', '#C7CDE0': 'heroText', '#C7BEFF': 'borderPurple',
  '#D8D2FF': 'borderPurpleSoft', '#D2CCFF': 'borderPurpleStrong', '#FECACA': 'borderDanger', '#5B4BDB': 'primary',
};
const darkSurfaces = new Set(['#F5F6FA', '#FFFFFF', '#111827', '#F0F1F5', '#ECEEF4', '#FAF9FF', '#F0EEFF', '#ECFDF3', '#FEF2F2', '#F3F4F6']);

function transformStyle(style, colors) {
  if (!style) return style;
  if (typeof style === 'function') return (...args) => transformStyle(style(...args), colors);
  const flat = StyleSheet.flatten(style);
  if (!flat || typeof flat !== 'object') return flat;
  const next = { ...flat };
  for (const key of ['backgroundColor', 'color', 'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor']) {
    const raw = next[key];
    if (typeof raw !== 'string') continue;
    const token = lightColorMap[raw.toUpperCase()];
    if (!token) continue;
    if (key === 'color' && raw.toUpperCase() === '#FFFFFF') continue;
    if (key.startsWith('border') && raw.toUpperCase() === '#FFFFFF') continue;
    if (token === 'primary' && key === 'color') next[key] = colors.accentText;
    else if (token === 'primary' && key.startsWith('border')) next[key] = colors.borderPurple;
    else if (key === 'backgroundColor' && raw.toUpperCase() === '#111827') next[key] = colors.navy;
    else if (key === 'backgroundColor' && darkSurfaces.has(raw.toUpperCase())) next[key] = colors[token];
    else next[key] = colors[token];
  }
  return next;
}

function themedTree(element, colors) {
  if (!React.isValidElement(element)) return element;
  const props = {};
  if (element.props.style) props.style = transformStyle(element.props.style, colors);
  for (const prop of ['color', 'placeholderTextColor', 'tintColor']) {
    const raw = element.props[prop];
    if (typeof raw !== 'string' || raw.toUpperCase() === '#FFFFFF') continue;
    const token = lightColorMap[raw.toUpperCase()];
    if (token) props[prop] = token === 'primary' ? colors.accentText : colors[token];
  }
  if (element.props.children) props.children = React.Children.map(element.props.children, (child) => themedTree(child, colors));
  for (const prop of ['ListHeaderComponent', 'ListFooterComponent']) {
    if (React.isValidElement(element.props[prop])) props[prop] = themedTree(element.props[prop], colors);
    else if (typeof element.props[prop] === 'function') {
      const render = element.props[prop];
      props[prop] = (...args) => themedTree(render(...args), colors);
    }
  }
  if (typeof element.props.renderItem === 'function') {
    const renderItem = element.props.renderItem;
    props.renderItem = (...args) => themedTree(renderItem(...args), colors);
  }
  return React.cloneElement(element, props);
}

export function ThemeScope({ children }) {
  const { colors } = useTheme();
  return <>{React.Children.map(children, (child) => themedTree(child, colors))}</>;
}

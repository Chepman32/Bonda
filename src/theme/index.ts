import { useColorScheme } from 'react-native';

import { gradients, palette, radius, spacing, typography } from './tokens';

export const themes = {
  dark: {
    isDark: true,
    background: palette.graphite,
    backgroundSecondary: '#0F1526',
    panel: 'rgba(255, 255, 255, 0.08)',
    panelStrong: 'rgba(255, 255, 255, 0.14)',
    text: palette.pearl,
    textMuted: '#A9B4C8',
    border: 'rgba(255, 255, 255, 0.12)',
    accent: palette.indigo,
    accentMuted: palette.violet,
    glow: 'rgba(121, 217, 255, 0.20)',
    danger: palette.danger,
    success: palette.success,
    warning: palette.warning,
  },
  light: {
    isDark: false,
    background: '#EDF2FF',
    backgroundSecondary: '#F8FAFF',
    panel: 'rgba(255, 255, 255, 0.82)',
    panelStrong: 'rgba(255, 255, 255, 0.96)',
    text: '#101826',
    textMuted: '#56647A',
    border: 'rgba(16, 24, 38, 0.10)',
    accent: '#4254E8',
    accentMuted: '#8D7BFF',
    glow: 'rgba(82, 97, 255, 0.12)',
    danger: '#D96880',
    success: '#3BA883',
    warning: '#C58E2D',
  },
};

export type AppTheme = (typeof themes)[keyof typeof themes] & {
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  gradients: typeof gradients;
};

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  const selectedTheme = scheme === 'light' ? themes.light : themes.dark;

  return {
    ...selectedTheme,
    spacing,
    radius,
    typography,
    gradients,
  };
}

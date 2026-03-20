export const palette = {
  graphite: '#080B12',
  midnight: '#111827',
  indigo: '#5261FF',
  violet: '#9A84FF',
  aqua: '#79D9FF',
  amber: '#F8C36D',
  rose: '#FF9CB5',
  pearl: '#F5F7FF',
  slate: '#7A869D',
  cloud: '#E6EEFF',
  success: '#7ED7B8',
  warning: '#F8C36D',
  danger: '#FF8FA9',
};

export const gradients = {
  cosmic: ['#080B12', '#111827', '#16203A'],
  halo: ['#5261FF', '#9A84FF', '#79D9FF'],
  warmth: ['#F8C36D', '#FF9CB5', '#9A84FF'],
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const typography = {
  hero: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  section: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  metric: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
};

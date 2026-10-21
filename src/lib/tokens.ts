// Design tokens — JS export for inline styles (charts, dynamic styles)

export const colors = {
  background: '#0a0a0b',
  surface: 'rgba(255,255,255,0.03)',
  surfaceBorder: 'rgba(255,255,255,0.06)',
  surfaceHover: 'rgba(255,255,255,0.05)',

  gold: '#f4be7e',
  goldLight: '#f9d09f',
  goldDark: '#d4a06a',
  brandRed: '#DC2626',

  blue: '#5682f2',
  blueLight: '#7ea0f8',

  textPrimary: '#f5f5f5',
  textSecondary: '#a0a0a6',
  textTertiary: '#6b6b73',

  positive: '#34d399',
  negative: '#f87171',

  // Chart palette (premium)
  chart1: '#f4be7e', // gold
  chart2: '#5682f2', // blue
  chart3: '#34d399', // green
  chart4: '#a78bfa', // purple
  chart5: '#f97316', // orange
  chart6: '#ec4899', // pink
} as const;

export const gradients = {
  signature: 'linear-gradient(116deg, #5682f2, #f9d09f)',
  gold: 'linear-gradient(135deg, #f4be7e, #f9d09f)',
  goldButton: 'linear-gradient(135deg, #d4a06a, #f4be7e, #f9d09f)',
  cardGlow: '0 0 40px rgba(244,190,126,0.06)',
  cardGlowHover: '0 0 60px rgba(244,190,126,0.12)',
} as const;

export const chartPalette = [
  colors.chart1,
  colors.chart2,
  colors.chart3,
  colors.chart4,
  colors.chart5,
  colors.chart6,
];

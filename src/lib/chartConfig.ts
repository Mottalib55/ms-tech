// Shared Recharts configuration — premium glassmorphic tooltips, axis styles, palette

import { colors, chartPalette } from './tokens';

export const tooltipStyle = {
  backgroundColor: 'rgba(20,20,22,0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

export const tooltipLabelStyle = {
  color: colors.textSecondary,
  fontSize: 12,
  marginBottom: 4,
};

export const tooltipItemStyle = {
  color: colors.textPrimary,
  fontSize: 13,
};

export const axisTickStyle = {
  fill: colors.textTertiary,
  fontSize: 11,
};

export { chartPalette, colors };

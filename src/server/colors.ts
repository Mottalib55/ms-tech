const TYPE_COLORS: Record<string, string> = {
  bank: '#5682f2', brokerage: '#f4be7e', insurance: '#a78bfa', crypto: '#f97316',
  'real-estate': '#34d399', loan: '#f87171', other: '#94a3b8',
};
export const colorForType = (type: string) => TYPE_COLORS[type] ?? TYPE_COLORS.other;

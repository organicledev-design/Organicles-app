// Color scheme inspired by Organicles brand
export const COLORS = {
  // Primary Colors - Earthy Greens
  primary: '#2D5016', // Deep forest green
  primaryLight: '#4A7C2B',
  primaryDark: '#1A3B0D',
  
  // Secondary Colors - Warm Earth Tones
  secondary: '#D4C5A0', // Warm beige/cream
  secondaryLight: '#E8DFC8',
  secondaryDark: '#B8A87D',
  
  // Accent Colors
  accent: '#8B6F47', // Warm brown
  accentGold: '#DAA520',
  
  // Functional Colors
  success: '#4CAF50',
  error: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#1C1C1C',
  background: '#F9F6F0', // Warm off-white
  surface: '#FFFFFF',
  
  // Text Colors
  textPrimary: '#1C1C1C',
  textSecondary: '#6B6B6B',
  textLight: '#9B9B9B',
  textInverse: '#FFFFFF',
  
  // Border & Shadow
  border: '#E0DCD0',
  shadow: 'rgba(45, 80, 22, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 48,
};

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

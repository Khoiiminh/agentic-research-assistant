/**
 * Colors - Design system color palette
 */

export const colors = {
  // Neutrals
  black: '#000000',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Primary - Dark purple palette
  primary50: '#F0F0FF',
  primary100: '#E0E0FF',
  primary200: '#C0C0FF',
  primary300: '#9696FF',
  primary400: '#6366F1',
  primary500: '#6366F1',
  primary600: '#4B4DB5',
  primary700: '#323379',
  primary800: '#1A1A4D',
  primary900: '#000000',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#6366F1',
};

export type ColorKey = keyof typeof colors;

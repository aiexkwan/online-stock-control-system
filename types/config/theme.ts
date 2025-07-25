/**
 * Theme Configuration Type Definitions
 * Theme mapping and configuration types
 */

// Active themes constant
export type ActiveTheme = 'operations' | 'data-management' | 'analytics';

// Theme mapping type
export type ThemeMapping = Record<string, string>;

// Theme display names type
export type ThemeDisplayNames = Record<ActiveTheme, string>;

// Theme descriptions type
export type ThemeDescriptions = Record<ActiveTheme, string>;

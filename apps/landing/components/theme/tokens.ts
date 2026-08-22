import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

export const lightTokens = {
  colorPrimary: '#1E5BFF',
  colorBgLayout: '#F7F9FC',
  colorBgContainer: '#FFFFFF',
  colorBorder: '#E5EAF2',
  colorText: '#0B1726',
  colorTextSecondary: '#56627A',
  borderRadius: 8,
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

export const darkTokens = {
  colorPrimary: '#3B82F6',
  colorBgLayout: '#0A1020',
  colorBgContainer: '#111A2E',
  colorBorder: '#1E2A44',
  colorText: '#E6ECF5',
  colorTextSecondary: '#8A98B0',
  borderRadius: 8,
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

export const lightTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: lightTokens,
};

export const darkTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: darkTokens,
};

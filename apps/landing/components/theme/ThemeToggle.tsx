'use client';

import { Segmented } from 'antd';
import { SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Segmented
      size="small"
      value={theme}
      onChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}
      options={[
        { label: <SunOutlined aria-label="Light" />, value: 'light' },
        { label: <DesktopOutlined aria-label="System" />, value: 'system' },
        { label: <MoonOutlined aria-label="Dark" />, value: 'dark' },
      ]}
      aria-label="Theme mode"
    />
  );
}

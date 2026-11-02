'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Segmented } from './kit';

type Theme = 'system' | 'light' | 'dark';

export default function ThemeSwitcher() {
  const t = useTranslations('common.theme');
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    // Read after hydration: the server cannot know this preference.
    const saved = localStorage.getItem('ms-theme');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);

  const change = (next: Theme) => {
    setTheme(next);
    if (next === 'system') {
      localStorage.removeItem('ms-theme');
      delete document.documentElement.dataset.theme;
    } else {
      localStorage.setItem('ms-theme', next);
      document.documentElement.dataset.theme = next;
    }
  };

  return (
    <Segmented
      label={t('label')}
      value={theme}
      onChange={change}
      options={[{ value: 'system', label: t('system') }, { value: 'light', label: t('light') }, { value: 'dark', label: t('dark') }]}
    />
  );
}

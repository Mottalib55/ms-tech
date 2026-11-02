'use client';

import { useEffect, useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import { LOCK_KEY, biometricAvailable, isNative, verifyBiometric } from '@/lib/native';

/** In the iOS app only: Face ID lock on launch and on return from the background. */
export default function NativeShell() {
  const t = useTranslations('common.lock');
  const reason = t('reason');
  const [locked, setLocked] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isNative()) return;
    let stop = () => {};
    const unlock = async () => {
      setFailed(false);
      if (await verifyBiometric(reason)) setLocked(false);
      else setFailed(true);
    };
    const engage = async () => {
      if (localStorage.getItem(LOCK_KEY) !== '1' || !(await biometricAvailable())) return;
      setLocked(true);
      await unlock();
    };
    engage();
    (async () => {
      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('appStateChange', ({ isActive }) => { if (isActive) engage(); else if (localStorage.getItem(LOCK_KEY) === '1') setLocked(true); });
      stop = () => handle.remove();
      // Dark text on the light theme, light text on the dark one.
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      const dark = getComputedStyle(document.documentElement).colorScheme === 'dark';
      await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
    })();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!locked) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-bg flex flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="w-14 h-14 rounded-[14px] bg-surface text-ink flex items-center justify-center"><Fingerprint size={32} /></span>
      <h1 className="text-xl font-semibold text-ink">{t('title')}</h1>
      {failed && <p className="text-sm text-muted">{t('failed')}</p>}
      <Button onClick={async () => { setFailed(false); if (await verifyBiometric(reason)) setLocked(false); else setFailed(true); }}>{t('unlock')}</Button>
    </div>
  );
}

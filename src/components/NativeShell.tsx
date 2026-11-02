'use client';

import { useEffect, useState } from 'react';
import { Fingerprint } from 'lucide-react';
import Button from '@/components/ui/Button';
import { LOCK_KEY, biometricAvailable, isNative, verifyBiometric } from '@/lib/native';

/** In the iOS app only: Face ID lock on launch and on return from the background. */
export default function NativeShell() {
  const [locked, setLocked] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isNative()) return;
    let stop = () => {};
    const unlock = async () => {
      setFailed(false);
      if (await verifyBiometric()) setLocked(false);
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
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    })();
    return () => stop();
  }, []);

  if (!locked) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0a0b] flex flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="w-16 h-16 rounded-[20px] bg-[#f4be7e]/10 text-[#f4be7e] flex items-center justify-center"><Fingerprint size={32} /></span>
      <h1 className="text-xl font-bold text-[#f5f5f5]">MS Tech est verrouillé</h1>
      {failed && <p className="text-sm text-[#a0a0a6]">Identification non aboutie.</p>}
      <Button onClick={async () => { setFailed(false); if (await verifyBiometric()) setLocked(false); else setFailed(true); }}>Déverrouiller</Button>
    </div>
  );
}

export const LOCK_KEY = 'ms-biometric-lock';

export function isNative(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

export async function biometricAvailable(): Promise<boolean> {
  if (!isNative()) return false;
  const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
  return (await BiometricAuth.checkBiometry()).isAvailable;
}

export async function verifyBiometric(reason: string): Promise<boolean> {
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    await BiometricAuth.authenticate({ reason, allowDeviceCredential: true });
    return true;
  } catch {
    return false;
  }
}

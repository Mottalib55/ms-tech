import { CompactEncrypt, compactDecrypt } from 'jose';

const getEncryptionKey = (): Uint8Array => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY environment variable is required');
  // Key should be 32 bytes hex-encoded (64 chars) or base64-encoded
  if (key.length === 64) {
    return Uint8Array.from(Buffer.from(key, 'hex'));
  }
  return Uint8Array.from(Buffer.from(key, 'base64'));
};

export async function encrypt(plaintext: string): Promise<string> {
  const key = getEncryptionKey();
  const encoder = new TextEncoder();
  const jwe = await new CompactEncrypt(encoder.encode(plaintext))
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .encrypt(key);
  return jwe;
}

export async function decrypt(jwe: string): Promise<string> {
  const key = getEncryptionKey();
  const { plaintext } = await compactDecrypt(jwe, key);
  return new TextDecoder().decode(plaintext);
}

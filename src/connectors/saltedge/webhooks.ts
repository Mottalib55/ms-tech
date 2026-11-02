import { createVerify } from 'node:crypto';

// https://docs.saltedge.com/v6/ (Callbacks > Request identification > Signature)
// Key version 6.0. Overridable if Salt Edge rotates it (Signature-key-version header).
const SALTEDGE_PUBLIC_KEY_V6 = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8qxSS5BmftHK/eyW+o98
NR89TyDmz1V8e6yyFdoMPddEYN4Bcidkk2whoJEc/T/AKghHQ9Nq+DuebnRYYcSJ
YT99VbR1PpIw2R9i8z+DZ79hoizy6z+rwxGANnJOr5BDF5HUKJ8uKS9yGRieojFv
Y9j+rxH6Fj6P90bO4d2igYYspKVoI3Zb3hWS0LrWN+JXAaW9qcOmQPTgO0WG0MUK
gB3NNMfN7gMIkl3chbaULiEgVciP2qZTIGb1b7IDr5+fA9oVVGaXiybdieGHIa4J
S7JNTf0JjWrIKd2DaczKULnghqNQsnoCu+S8BurEOJR5EN1BBfQBPlbSh+ru1zgZ
AQIDAQAB
-----END PUBLIC KEY-----`;

/** base64(RSA-SHA256("callback_url|post_body")), verified with Salt Edge's public key. */
export function verifySaltEdgeWebhook(
  body: string,
  signature: string,
  callbackUrl: string,
  publicKey: string = process.env.SALTEDGE_PUBLIC_KEY?.replace(/\\n/g, '\n') || SALTEDGE_PUBLIC_KEY_V6,
): boolean {
  if (!signature || !callbackUrl) return false;
  try {
    return createVerify('RSA-SHA256').update(`${callbackUrl}|${body}`).verify(publicKey, signature, 'base64');
  } catch {
    return false;
  }
}

export interface SaltEdgeWebhookPayload {
  data: {
    connection_id?: string;
    customer_id?: string;
    custom_fields?: Record<string, string>;
    stage?: string;
    error_class?: string;
    error_message?: string;
  };
  meta: { version: string; time: string };
}

export function parseSaltEdgeWebhook(body: string): SaltEdgeWebhookPayload {
  return JSON.parse(body) as SaltEdgeWebhookPayload;
}

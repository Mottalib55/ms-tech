// The two messages the browser writes itself, when no answer reached it from the server.
const OFFLINE = {
  fr: ['Connexion impossible. Vérifiez votre réseau.', 'Une erreur est survenue.'],
  en: ["Couldn't connect. Check your network.", 'Something went wrong.'],
  ar: ['تعذّر الاتصال. تحقّق من الشبكة.', 'حدث خطأ.'],
};
const local = (i: 0 | 1) => (OFFLINE[(typeof document === 'undefined' ? 'en' : document.documentElement.lang) as keyof typeof OFFLINE] ?? OFFLINE.en)[i];

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Every call the UI makes. A dead session goes to login instead of a broken page. */
export async function api<T = unknown>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init?.method ?? 'GET',
      headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new HttpError(0, local(0));
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !url.startsWith('/api/auth')) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new HttpError(res.status, (data as { error?: string } | null)?.error ?? local(1));
  }
  return data as T;
}

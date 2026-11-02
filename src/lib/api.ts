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
    throw new HttpError(0, 'Connexion impossible. Vérifiez votre réseau.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !url.startsWith('/api/auth')) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new HttpError(res.status, (data as { error?: string } | null)?.error ?? 'Une erreur est survenue.');
  }
  return data as T;
}

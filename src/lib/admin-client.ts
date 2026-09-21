/**
 * Admin Client Utility for reliable auth across mobile Safari / iOS and desktop browsers.
 */

export const ADMIN_TOKEN_KEY = 'kiyoki_admin_token';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function removeAdminToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(init?.headers);

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: 'include', // Guarantees cookies are also transmitted when available
  });
}

/**
 * Safe date and time formatters that do not crash on iOS Safari with space-separated or invalid dates
 */
export function safeFormatDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const normalized = dateStr.includes(' ') && !dateStr.includes('T')
      ? dateStr.replace(' ', 'T') + 'Z'
      : dateStr;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString();
  } catch {
    return dateStr || 'N/A';
  }
}

export function safeFormatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const normalized = dateStr.includes(' ') && !dateStr.includes('T')
      ? dateStr.replace(' ', 'T') + 'Z'
      : dateStr;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString();
  } catch {
    return dateStr || 'N/A';
  }
}

export function safeFormatTime(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const normalized = dateStr.includes(' ') && !dateStr.includes('T')
      ? dateStr.replace(' ', 'T') + 'Z'
      : dateStr;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleTimeString();
  } catch {
    return dateStr || 'N/A';
  }
}

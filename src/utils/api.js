import { clearSession } from "./auth";
const BASE = process.env.REACT_APP_API_URL ?? '';
 
async function req(method, path, body, retry = true) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Si el access token expiró, intentar refresh una sola vez
  if (res.status === 401 && retry) {
    const refreshed = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST', credentials: 'include',
    });
    if (refreshed.ok) {
      return req(method, path, body, false); // reintentar con el nuevo token
    } else {
      clearSession();
      window.location.hash = '/login';
      throw new Error('Sesión expirada');
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Error desconocido');
  return data;
}
 
export const api = {
  // ── Auth ────────────────────────────────────────────────────────────
  auth: {
    register: (body)       => req('POST', '/auth/register', body),
    login:    (body)       => req('POST', '/auth/login',    body),
    google:   (credential) => req('POST', '/auth/google',   { credential }),
    me:       ()           => req('GET',  '/auth/me'),
    search:   (q)          => req('GET',  `/auth/search?q=${encodeURIComponent(q)}`),
  },

  // ── Groups ──────────────────────────────────────────────────────────
  groups: {
    list:       ()       => req('GET',    '/groups'),
    get:        (id)     => req('GET',    `/groups/${id}`),
    create:     (body)   => req('POST',   '/groups', body),
    update:     (id, b)  => req('PUT',    `/groups/${id}`, b),
    delete:     (id)     => req('DELETE', `/groups/${id}`),
    byUsername: (username) => req('GET',  `/groups/user/${username}`),
  },
  players: {
    search: (q = '')     => req('GET', `/players?q=${encodeURIComponent(q)}`),
    rename: (id, name)   => req('PATCH', `/players/${id}`, { name }),
    removeFromGroup: (playerId, groupId) =>
      req('DELETE', `/players/${playerId}/group/${groupId}`),
  },
  tournaments: {
    get:         (id)       => req('GET',    `/tournaments/${id}`),
    create:      (body)     => req('POST',   '/tournaments', body),
    update:      (id, body) => req('PATCH',  `/tournaments/${id}`, body),
    delete:      (id)       => req('DELETE', `/tournaments/${id}`),
    resetScores: (id)       => req('DELETE', `/tournaments/${id}/matches`),
  },
  matches: {
    create: (body)   => req('POST',   '/matches',       body),
    update: (id, b)  => req('PUT',    `/matches/${id}`, b),
    delete: (id)     => req('DELETE', `/matches/${id}`),
  },
  pairs: {
    create: (body)   => req('POST',   '/pairs',       body),
    update: (id, b)  => req('PUT',    `/pairs/${id}`, b),
    delete: (id)     => req('DELETE', `/pairs/${id}`),
  },
  readonly: {
    get: (id) => req('GET', `/readonly/${id}`),
  },
};

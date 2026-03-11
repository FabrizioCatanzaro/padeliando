const BASE = process.env.REACT_APP_API_URL ?? '';
 
async function req(method, path, body) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Error desconocido');
  return data;
}
 
export const api = {
  groups: {
    list:   ()           => req('GET', '/groups'),
    get:    (id)         => req('GET', `/groups/${id}`),
    create: (body)       => req('POST', '/groups', body),
    delete: (id)         => req('DELETE', `/groups/${id}`),
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

import { clearUser } from './auth'

const BASE = import.meta.env.VITE_API_URL ?? ''

async function req(method, path, body, retry = true) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && retry && path !== '/auth/refresh' && path !== '/auth/login' && path !== '/auth/me') {
    const refreshed = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST', credentials: 'include',
    })
    if (refreshed.ok) {
      return req(method, path, body, false)
    } else {
      clearUser()
      const p = window.location.pathname
      if (p !== '/login' && p !== '/register' && !p.startsWith('/reset-password/')) {
        window.location.href = '/login?expired=1'
      }
      throw new Error('Sesión expirada')
    }
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Error desconocido')
  return data
}

export const api = {
  auth: {
    register:       (body) => req('POST', '/auth/register', body),
    login:          (body) => req('POST', '/auth/login',    body),
    google:         (cred) => req('POST', '/auth/google',   { credential: cred }),
    me:             ()     => req('GET',  '/auth/me'),
    logout:         ()     => req('POST', '/auth/logout'),
    search:         (q)    => req('GET',  `/auth/search?q=${encodeURIComponent(q)}`),
    forgotPassword: (email)       => req('POST',  '/auth/forgot-password',  { email }),
    resetPassword:  (token, pass) => req('POST',  '/auth/reset-password',   { token, password: pass }),
    updateMe:       (body)        => req('PATCH', '/auth/me', body),
  },
  groups: {
    list:          ()         => req('GET',    '/groups'),
    search:        (q)        => req('GET',    `/groups/search?q=${encodeURIComponent(q)}`),
    participating: ()         => req('GET',    '/groups/participating'),
    get:           (id)       => req('GET',    `/groups/${id}`),
    history:       (id)       => req('GET',    `/groups/${id}/history`),
    create:        (body)     => req('POST',   '/groups', body),
    update:        (id, b)    => req('PUT',    `/groups/${id}`, b),
    delete:        (id)       => req('DELETE', `/groups/${id}`),
    byUsername:    (username) => req('GET',    `/groups/user/${username}`),
  },
  players: {
    search:               (q, groupId, mine) => req('GET', `/players?q=${encodeURIComponent(q)}${groupId ? `&groupId=${groupId}` : ''}${mine ? '&mine=true' : ''}`),
    resolve:              (name, groupId, tournamentId) => req('POST', '/players/resolve', { name, groupId, tournamentId }),
    rename:               (id, name, groupId) => req('PATCH',  `/players/${id}`, { name, groupId }),
    removeFromTournament: (pId, tId)      => req('DELETE', `/players/${pId}/tournament/${tId}`),
    removeFromGroup:      (pId, gId)      => req('DELETE', `/players/${pId}/group/${gId}`),
  },
  tournaments: {
    get:         (id)   => req('GET',    `/tournaments/${id}`),
    create:      (body) => req('POST',   '/tournaments', body),
    update:      (id,b) => req('PATCH',  `/tournaments/${id}`, b),
    delete:      (id)   => req('DELETE', `/tournaments/${id}`),
    resetScores: (id)   => req('DELETE', `/tournaments/${id}/matches`),
    setLive:      (id,d)       => req('PATCH',  `/tournaments/${id}/live`, { live_match: d }),
    schedule:     (id)         => req('POST',   `/tournaments/${id}/schedule`),
    bracket:      (id)         => req('POST',   `/tournaments/${id}/bracket`),
    updateBracket:(id, mId, b) => req('PATCH',  `/tournaments/${id}/bracket/${mId}`, b),
    setBracket:   (id, b)     => req('PATCH',  `/tournaments/${id}/bracket`, { bracket: b }),
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
  invitations: {
    list:   ()                           => req('GET',    '/invitations'),
    count:  ()                           => req('GET',    '/invitations/count'),
    send:   (playerId, groupId, identifier) => req('POST', '/invitations', { playerId, groupId, identifier }),
    respond:(id, action)                 => req('PATCH',  `/invitations/${id}`, { action }),
    cancel: (id)                         => req('DELETE', `/invitations/${id}`),
  },
}
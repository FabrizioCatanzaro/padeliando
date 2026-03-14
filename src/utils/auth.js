const USER_KEY = 'padeliando_user';

export function saveSession(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
export function clearSession()    { localStorage.removeItem(USER_KEY); }

export function clearUser() {
    localStorage.removeItem('padeliando_user')
}
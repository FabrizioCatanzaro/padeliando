const USER_KEY = 'padeliando_user';

export function getUser()    { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }
export function isLoggedIn() { return !!getUser(); }
export function saveSession(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
export function clearSession()    { localStorage.removeItem(USER_KEY); }
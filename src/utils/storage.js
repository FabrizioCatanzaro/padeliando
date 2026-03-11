import { uid } from "./helpers";

export const STORAGE_KEY_CURRENT  = "padel_current";
export const STORAGE_KEY_PREFIX   = "padel_tournament_";
export const STORAGE_PLAYERS_DB   = "padel_players_db";
export const STORAGE_ALL_IDS      = "padel_tournament_ids";

// ── Players DB ────────────────────────────────────────────────────────────────

export function getPlayersDB() {
  try {
    const raw = localStorage.getItem(STORAGE_PLAYERS_DB);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function savePlayersDB(db) {
  localStorage.setItem(STORAGE_PLAYERS_DB, JSON.stringify(db));
}

/**
 * Looks up a player name (case-insensitive) in the DB.
 * If found, returns the existing player (same ID → history preserved).
 * If not found, creates a new entry.
 */
export function resolvePlayer(name, db) {
  const key = name.trim().toLowerCase();
  const existing = Object.values(db).find(p => p.name.toLowerCase() === key);
  if (existing) return { player: existing, db };
  const newPlayer = { id: uid(), name: name.trim(), createdAt: new Date().toISOString() };
  const newDb = { ...db, [newPlayer.id]: newPlayer };
  return { player: newPlayer, db: newDb };
}

// ── Current tournament ────────────────────────────────────────────────────────

export function loadCurrentTournament() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveTournamentLocal(tournament) {
  localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(tournament));
  localStorage.setItem(STORAGE_KEY_PREFIX + tournament.id, JSON.stringify(tournament));
  try {
    const raw = localStorage.getItem(STORAGE_ALL_IDS);
    const ids = raw ? JSON.parse(raw) : [];
    if (!ids.includes(tournament.id)) {
      ids.push(tournament.id);
      localStorage.setItem(STORAGE_ALL_IDS, JSON.stringify(ids));
    }
  } catch {}
}

export function deleteCurrentTournament() {
  localStorage.removeItem(STORAGE_KEY_CURRENT);
}

// ── Shared (read-only) ────────────────────────────────────────────────────────

export function loadSharedTournament(id) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Historical tournaments ────────────────────────────────────────────────────

export function loadAllTournaments() {
  try {
    const raw = localStorage.getItem(STORAGE_ALL_IDS);
    if (!raw) return [];
    const ids = JSON.parse(raw);
    return ids.reduce((acc, id) => {
      try {
        const t = localStorage.getItem(STORAGE_KEY_PREFIX + id);
        if (t) acc.push(JSON.parse(t));
      } catch {}
      return acc;
    }, []);
  } catch { return []; }
}
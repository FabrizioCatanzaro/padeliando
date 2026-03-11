import { api } from './api';
import { adaptTournament } from './helpers';
 
// ── Grupos ────────────────────────────────────────────────────────────
 
export async function loadGroups() {
  return api.groups.list();
}
 
export async function createGroup(name, description) {
  return api.groups.create({ name, description });
}
 
export async function deleteGroup(id) {
  return api.groups.delete(id);
}
 
// ── Torneo actual ─────────────────────────────────────────────────────
 
export async function loadCurrentTournament(tournamentId) {
  const t = await api.tournaments.get(tournamentId);
  return adaptTournament(t);
}
 
export async function loadTournamentsByGroup(groupId) {
  const group = await api.groups.get(groupId);
  return group.tournaments ?? [];
}
 
// ── Jugadores ─────────────────────────────────────────────────────────
 
export async function searchPlayers(q) {
  return api.players.search(q);
}
 
// ── Readonly ──────────────────────────────────────────────────────────
 
export async function loadSharedTournament(id) {
  const t = await api.readonly.get(id);
  return adaptTournament(t);
}

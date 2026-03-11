import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { adaptTournament, adaptMatch, adaptPair, uid } from '../utils/helpers';
 
export function useTournament(groupId, tournamentId) {
  const [tournament, setTournament] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [saved,      setSaved]      = useState(false);
 
  // Carga el torneo al montar (o cuando cambia tournamentId)
  const reload = useCallback(async () => {
    if (!tournamentId) { setLoading(false); return; }
    setLoading(true);
    try {
      const t = await api.tournaments.get(tournamentId);
      setTournament(adaptTournament(t));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);
 
  useEffect(() => { reload(); }, [reload]);
 
  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }
 
  // ── Crear torneo ────────────────────────────────────────────────────
  async function handleCreate(name, playerNames, pairsInput) {
    const t = await api.tournaments.create({
      groupId,
      name,
      mode:        pairsInput ? 'pairs' : 'free',
      playerNames: playerNames.filter(Boolean),
      pairs:       pairsInput ?? [],
    });
    setTournament(adaptTournament(t));
    return t.id; // para que App.js pueda navegar al torneo
  }
 
  // ── Partidos ────────────────────────────────────────────────────────
  async function handleAddMatch(matchData) {
    // matchData: { team1, team2, score1, score2, date }
    await api.matches.create({
      tournamentId: tournament.id,
      team1:    matchData.team1,
      team2:    matchData.team2,
      score1:   matchData.score1,
      score2:   matchData.score2,
      playedAt: matchData.date,
    });
    await reload();
    flash();
  }
 
  async function handleEditMatch(matchId, matchData) {
    await api.matches.update(matchId, {
      team1:    matchData.team1,
      team2:    matchData.team2,
      score1:   matchData.score1,
      score2:   matchData.score2,
      playedAt: matchData.date,
    });
    await reload();
    flash();
  }
 
  async function handleDeleteMatch(matchId) {
    await api.matches.delete(matchId);
    await reload();
  }
 
  // ── Jugadores ───────────────────────────────────────────────────────
  async function handleAddPlayer(name) {
    await api.players.search(name); // solo para verificar
    // resolve crea o reutiliza y vincula al grupo
    await fetch(`${process.env.REACT_APP_API_URL}/api/players/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, groupId }),
    });
    await reload();
    flash();
  }
 
  async function handleEditPlayer(playerId, newName) {
    await api.players.rename(playerId, newName);
    await reload();
    flash();
  }
 
  async function handleDeletePlayer(playerId) {
    await api.players.removeFromGroup(playerId, groupId);
    await reload();
  }
 
  // ── Parejas ─────────────────────────────────────────────────────────
  async function handleAddPair(p1Id, p2Id) {
    await api.pairs.create({ tournamentId: tournament.id, p1Id, p2Id });
    await reload();
    flash();
  }
 
  async function handleEditPair(pairId, p1Id, p2Id) {
    await api.pairs.update(pairId, { p1Id, p2Id });
    await reload();
    flash();
  }
 
  async function handleDeletePair(pairId) {
    await api.pairs.delete(pairId);
    await reload();
  }
 
  // ── Scores y torneo ─────────────────────────────────────────────────
  async function handleResetScores() {
    await api.tournaments.resetScores(tournament.id);
    await reload();
  }
 
  async function handleDeleteTournament() {
    await api.tournaments.delete(tournament.id);
  }
 
  function getShareLink() {
    if (!tournament) return '';
    return `${window.location.href.split('#')[0]}#readonly:${tournament.id}`;
  }
 
  return {
    tournament, loading, error, saved,
    handleCreate,
    handleAddMatch,    handleEditMatch,    handleDeleteMatch,
    handleAddPlayer,   handleEditPlayer,   handleDeletePlayer,
    handleAddPair,     handleEditPair,     handleDeletePair,
    handleResetScores, handleDeleteTournament,
    getShareLink,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { adaptTournament, getTournamentWinnerLabel } from '../utils/helpers';
import { useAuth } from '../context/useAuth';

export function useTournament(groupId, tournamentId) {
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [groupOwnerId,      setGroupOwnerId]      = useState(null);
  const [groupOwnerIsPremium, setGroupOwnerIsPremium] = useState(false);
  const [groupName,  setGroupName]  = useState(null);
  const [groupEmojis, setGroupEmojis] = useState([]);
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
      setGroupOwnerIsPremium(t.owner_is_premium ?? false);
      const gId = groupId ?? t.group_id;
      if (gId) {
        const g = await api.groups.get(gId);
        setGroupOwnerId(g.user_id);
        setGroupName(g.name);
        setGroupEmojis(g.emojis ?? []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, groupId]);
 
  useEffect(() => { reload(); }, [reload]);
 
  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }
 
  // ── Crear torneo ────────────────────────────────────────────────────
  async function handleCreate(name, playerNames, pairsInput, format = 'liga') {

    const t = await api.tournaments.create({
      groupId,
      name,
      mode:        pairsInput ? 'pairs' : 'free',
      format,
      playerNames: playerNames.filter(Boolean),
      pairs:       pairsInput ?? [],
    });
    setTournament(adaptTournament(t));
    return t.id; // para que App.js pueda navegar al torneo
  }
 
  // ── Partidos ────────────────────────────────────────────────────────
  async function handleAddMatch(matchData) {
    await api.matches.create({
      tournamentId: tournament.id,
      team1:        matchData.team1,
      team2:        matchData.team2,
      score1:       matchData.score1,
      score2:       matchData.score2,
      playedAt:     matchData.date,
      duration_seconds: matchData.duration_seconds,
      sets_format:  matchData.sets_format ?? null,
      sets:         matchData.sets ?? [],
    });
    await reload();
    flash();
  }

  async function handleEditMatch(matchId, matchData) {
    await api.matches.update(matchId, {
      team1:            matchData.team1,
      team2:            matchData.team2,
      score1:           matchData.score1,
      score2:           matchData.score2,
      playedAt:         matchData.date,
      duration_seconds: matchData.duration_seconds ?? null,
      sets_format:      matchData.sets_format ?? null,
      sets:             matchData.sets ?? [],
    });
    await reload();
    flash();
  }
 
  async function handleDeleteMatch(matchId) {
    await api.matches.delete(matchId);
    await reload();
  }
 
  // ── Jugadores ───────────────────────────────────────────────────────
  async function syncMode() {
    const t = await api.tournaments.get(tournamentId);
    const count = (t.players ?? []).filter((p) => !p.removed).length;
    const expected = count % 2 !== 0 ? 'free' : 'pairs';
    if (expected !== t.mode) {
      await api.tournaments.update(t.id, { mode: expected });
    }
  }

  async function handleAddPlayer(name) {
    await api.players.resolve(name, groupId, tournamentId);
    await syncMode();
    await reload();
    flash();
  }

  async function handleEditPlayer(playerId, newName) {
    await api.players.rename(playerId, newName, groupId);
    await reload();
    flash();
  }

  async function handleDeletePlayer(playerId) {
    await api.players.removeFromTournament(playerId, tournamentId);
    await syncMode();
    await reload();
  }
 
  // ── Parejas ─────────────────────────────────────────────────────────
  async function handleAddPair(p1Id, p2Id) {
    await api.pairs.create({ tournamentId: tournament.id, p1Id, p2Id });
    if (tournament.mode === 'free') {
      await api.tournaments.update(tournament.id, { mode: 'pairs' });
    }
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

  async function handleToggleStatus() {
    const newStatus = tournament.status === 'active' ? 'finished' : 'active';
    const body = { status: newStatus };
    if (newStatus === 'finished') body.winner_label = getTournamentWinnerLabel(tournament) ?? '';
    await api.tournaments.update(tournament.id, body);
    await reload();
  }

  async function handleUpdateName(name) {
    await api.tournaments.update(tournament.id, { name });
    await reload();
  }

  async function handleSetLiveMatch(data) {
    await api.tournaments.setLive(tournament.id, data ?? null);
  }

  async function handleGenerateSchedule() {
    const data = await api.tournaments.schedule(tournament.id);
    localStorage.setItem(`previa_schedule_${tournament.id}`, JSON.stringify(data.schedule));
    return data.schedule;
  }

  async function handleGenerateBracket() {
    await api.tournaments.bracket(tournament.id);
    await reload();
  }

  async function handleUpdateBracketMatch(matchId, score1, score2, duration_seconds) {
    await api.tournaments.updateBracket(tournament.id, matchId, { score1, score2, duration_seconds });
    await reload();
  }

  async function handleSetBracket(bracket) {
    await api.tournaments.setBracket(tournament.id, bracket);
    await reload();
  }

  function getShareLink() {
    if (!tournament) return '';
    return `${window.location.origin}/readonly/${tournament.id}`;
  }
 
  const isOwner = !!user && !!tournament && groupOwnerId != null && String(groupOwnerId) === String(user.id);

  return {
    tournament, groupName, groupEmojis, groupOwnerIsPremium, loading, error, saved, isOwner,
    handleCreate,
    handleAddMatch,    handleEditMatch,    handleDeleteMatch,
    handleAddPlayer,   handleEditPlayer,   handleDeletePlayer,
    handleAddPair,     handleEditPair,     handleDeletePair,
    handleResetScores, handleDeleteTournament,
    getShareLink, handleToggleStatus, handleUpdateName, handleSetLiveMatch,
    handleGenerateSchedule, handleGenerateBracket, handleUpdateBracketMatch, handleSetBracket,
  };
}

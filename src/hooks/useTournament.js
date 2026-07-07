import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { adaptTournament, getTournamentWinnerLabel } from '../utils/helpers';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';

export function useTournament(groupId, tournamentId) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tournament, setTournament] = useState(null);
  const [groupOwnerId,      setGroupOwnerId]      = useState(null);
  const [groupOwnerIsPremium, setGroupOwnerIsPremium] = useState(false);
  const [groupName,  setGroupName]  = useState(null);
  const [groupEmojis, setGroupEmojis] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [saved,      setSaved]      = useState(false);

  // Carga el torneo al montar (o cuando cambia tournamentId).
  // `silent` refresca los datos sin activar el skeleton de carga: se usa tras
  // agregar/editar jugadores o parejas para evitar el parpadeo de recarga.
  const reload = useCallback(async (silent = false) => {
    if (!tournamentId) {
      if (groupId) {
        try {
          const g = await api.groups.get(groupId);
          setGroupOwnerIsPremium(g.owner_is_premium ?? false);
        } catch { /* ignorar */ }
      }
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
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
  async function handleCreate(name, playerNames, pairsInput, format = 'liga', numberOfCourts = 1, extra = {}) {

    const t = await api.tournaments.create({
      groupId,
      name,
      mode:             pairsInput ? 'pairs' : 'free',
      format,
      playerNames:      playerNames.filter(Boolean),
      pairs:            pairsInput ?? [],
      number_of_courts: numberOfCourts ?? 1,
      club_id:          extra.club_id ?? null,
      event_date:       extra.event_date ?? null,
      pending_club_request_id: extra.pending_club_request_id ?? null,
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
      court:        matchData.court ?? null,
    });
    await reload();
    flash();
    showToast('Partido registrado');
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
      court:            matchData.court ?? null,
    });
    await reload();
    flash();
    showToast('Partido actualizado');
  }

  async function handleDeleteMatch(matchId) {
    await api.matches.delete(matchId);
    await reload();
    showToast('Partido eliminado', 'error');
  }
 
  // ── Jugadores ───────────────────────────────────────────────────────
  async function syncMode() {
    const t = await api.tournaments.get(tournamentId);
    // El americano es siempre por parejas: nunca se cambia el modo. Si se hiciera,
    // desaparecería el gestor de parejas y no habría toggle para volver a activarlo.
    if (t.format === 'americano') return;
    const count = (t.players ?? []).filter((p) => !p.removed).length;
    // Solo forzar 'free' si el count es impar (no se pueden tener parejas fijas con impar)
    if (count % 2 !== 0 && t.mode === 'pairs') {
      await api.tournaments.update(t.id, { mode: 'free' });
    }
  }

  async function handleUpdateMode(newMode) {
    await api.tournaments.update(tournament.id, { mode: newMode });
    await reload(true);
    flash();
    showToast(newMode === 'pairs' ? 'Modo: parejas fijas' : 'Modo: equipos libres', 'info');
  }

  async function handleAddPlayer(name) {
    await api.players.resolve(name, groupId, tournamentId);
    await syncMode();
    await reload(true);
    flash();
    showToast('Jugador agregado');
  }

  async function handleEditPlayer(playerId, newName) {
    await api.players.rename(playerId, newName, groupId);
    await reload(true);
    flash();
    showToast('Jugador actualizado');
  }

  async function handleDeletePlayer(playerId) {
    await api.players.removeFromTournament(playerId, tournamentId);
    await syncMode();
    await reload(true);
    showToast('Jugador eliminado', 'error');
  }

  // ── Parejas ─────────────────────────────────────────────────────────
  async function handleAddPair(p1Id, p2Id) {
    await api.pairs.create({ tournamentId: tournament.id, p1Id, p2Id });
    if (tournament.mode === 'free') {
      await api.tournaments.update(tournament.id, { mode: 'pairs' });
    }
    await reload(true);
    flash();
    showToast('Pareja creada');
  }

  async function handleEditPair(pairId, p1Id, p2Id) {
    await api.pairs.update(pairId, { p1Id, p2Id });
    await reload(true);
    flash();
    showToast('Pareja actualizada');
  }

  async function handleDeletePair(pairId) {
    await api.pairs.delete(pairId);
    await reload(true);
    showToast('Pareja eliminada', 'error');
  }

  // ── Scores y torneo ─────────────────────────────────────────────────
  async function handleResetScores() {
    await api.tournaments.resetScores(tournament.id);
    await reload();
    showToast('Puntos reiniciados', 'info');
  }

  async function handleDeleteTournament() {
    await api.tournaments.delete(tournament.id);
    showToast('Torneo eliminado', 'error');
  }

  async function handleToggleStatus() {
    const newStatus = tournament.status === 'active' ? 'finished' : 'active';
    const body = { status: newStatus };
    if (newStatus === 'finished') body.winner_label = getTournamentWinnerLabel(tournament) ?? '';
    await api.tournaments.update(tournament.id, body);
    await reload();
    showToast(newStatus === 'finished' ? 'Torneo finalizado' : 'Torneo reanudado', 'info');
  }

  async function handleUpdateName(name) {
    await api.tournaments.update(tournament.id, { name });
    await reload();
    showToast('Nombre actualizado');
  }

  async function handleUpdateClubEvent({ club_id, event_date, number_of_courts }) {
    await api.tournaments.update(tournament.id, { club_id, event_date, number_of_courts });
    await reload();
    showToast('Club y fecha actualizados');
  }

  async function handleSetLiveMatch(data) {
    await api.tournaments.setLive(tournament.id, data ?? null);
    // Solo es metadata para los espectadores (ReadonlyView). No hace falta
    // recargar todo el torneo (eso disparaba el skeleton de carga y el
    // parpadeo al iniciar el cronómetro); basta con actualizar el estado local.
    setTournament((prev) => (prev ? { ...prev, live_match: data ?? null } : prev));
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

  async function handleUpdateBracketMatch(matchId, score1, score2, duration_seconds, court) {
    await api.tournaments.updateBracket(tournament.id, matchId, { score1, score2, duration_seconds, court });
    await reload();
  }

  async function handleSetBracket(bracket) {
    await api.tournaments.setBracket(tournament.id, bracket);
    await reload();
  }

  function getShareLink() {
    if (!tournament) return '';
    return `${window.location.origin}/view/${tournament.id}`;
  }
 
  const isOwner = !!user && !!tournament && groupOwnerId != null && String(groupOwnerId) === String(user.id);

  return {
    tournament, groupName, groupEmojis, groupOwnerIsPremium, loading, error, saved, isOwner,
    handleCreate,
    handleAddMatch,    handleEditMatch,    handleDeleteMatch,
    handleAddPlayer,   handleEditPlayer,   handleDeletePlayer,
    handleAddPair,     handleEditPair,     handleDeletePair,
    handleResetScores, handleDeleteTournament,
    getShareLink, handleToggleStatus, handleUpdateName, handleUpdateClubEvent, handleSetLiveMatch,
    handleGenerateSchedule, handleGenerateBracket, handleUpdateBracketMatch, handleSetBracket,
    handleUpdateMode,
    refresh: () => reload(true),
  };
}

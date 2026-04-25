/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { expandPair, emptyForm, localDateStr, getPairLabel } from "../../utils/helpers";
import MatchCard from "../Matches/MatchCard";
import MatchForm from "../Matches/MatchForm";
import Modal from "../shared/Modal";

const EMPTY_TIMER = { startedAt: null, stoppedAt: null };
const getLiveKey  = (id) => `live_${id}`;
const genId       = () => Math.random().toString(36).slice(2, 7);

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function findPlayedMatch(tournament, entry) {
  const pair1 = tournament.pairs.find(p => p.id === entry.team1.id);
  const pair2 = tournament.pairs.find(p => p.id === entry.team2.id);
  if (!pair1 || !pair2) return null;
  const ids1 = new Set([pair1.p1, pair1.p2]);
  const ids2 = new Set([pair2.p1, pair2.p2]);
  return tournament.matches.find(m => {
    const mt1 = new Set(m.team1);
    const mt2 = new Set(m.team2);
    return (setsEqual(mt1, ids1) && setsEqual(mt2, ids2))
        || (setsEqual(mt1, ids2) && setsEqual(mt2, ids1));
  }) ?? null;
}

export default function Previa({
  tournament, isOwner,
  onAddMatch, onEditMatch, onDeleteMatch, onSetLiveMatch,
  onGenerateSchedule, onGenerateBracket,
}) {
  const SCHEDULE_KEY = `previa_schedule_${tournament.id}`;

  const [schedule, setSchedule] = useState(() => {
    try {
      const raw = localStorage.getItem(SCHEDULE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [showSchedule,      setShowSchedule]      = useState(true);
  const [generating,        setGenerating]        = useState(false);
  const [generatingBracket, setGeneratingBracket] = useState(false);

  // ── Match management (mirrors Matches.jsx) ──────────────────────────────────
  const [liveMatches, setLiveMatches] = useState(() => {
    try {
      const raw = localStorage.getItem(getLiveKey(tournament.id));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [{ id: genId(), ...parsed }];
      return parsed;
    } catch { return []; }
  });

  const [editId,       setEditId]       = useState(null);
  const [editForm,     setEditForm]     = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const key = getLiveKey(tournament.id);
    if (liveMatches.length > 0) localStorage.setItem(key, JSON.stringify(liveMatches));
    else                        localStorage.removeItem(key);
  }, [liveMatches, tournament.id]);

  const prevLiveRef = useRef(liveMatches);

  function resolveTeamLabels(form) {
    const { players, pairs } = tournament;
    return {
      team1Label: getPairLabel(form.team1Pair, pairs, players),
      team2Label: getPairLabel(form.team2Pair, pairs, players),
    };
  }

  useEffect(() => {
    const prev = prevLiveRef.current;
    const newlyStarted = liveMatches.some((m) => {
      const prevMatch  = prev.find((p) => p.id === m.id);
      const wasIdle    = !prevMatch?.timer.startedAt;
      const nowRunning = m.timer.startedAt !== null && !m.timer.stoppedAt;
      return wasIdle && nowRunning;
    });
    if (newlyStarted) {
      const labels = liveMatches
        .filter((m) => m.timer.startedAt !== null)
        .map((m) => ({ ...resolveTeamLabels(m.form), phase: 'previa' }));
      onSetLiveMatch?.(labels.length > 0 ? labels : null);
    }
    prevLiveRef.current = liveMatches;
  }, [liveMatches]);

  function handleTimerChange(liveId, newTimerState) {
    setLiveMatches(prev => prev.map(m => m.id === liveId ? { ...m, timer: newTimerState } : m));
  }

  function handleFormChange(liveId, updater) {
    setLiveMatches(prev => prev.map(m => {
      if (m.id !== liveId) return m;
      const newForm = typeof updater === "function" ? updater(m.form) : updater;
      return { ...m, form: newForm };
    }));
  }

  function addNewMatch(prefilledPairs = {}) {
    setLiveMatches(prev => [...prev, { id: genId(), form: { ...emptyForm(), ...prefilledPairs }, timer: EMPTY_TIMER }]);
  }

  function handleCancelMatch(liveId) {
    setLiveMatches(prev => {
      const remaining = prev.filter(m => m.id !== liveId);
      const labels = remaining
        .filter(m => m.timer.startedAt !== null)
        .map(m => ({ ...resolveTeamLabels(m.form), phase: 'previa' }));
      onSetLiveMatch?.(labels.length > 0 ? labels : null);
      return remaining;
    });
  }

  async function handleSaveMatch(liveId) {
    const liveMatch = liveMatches.find(m => m.id === liveId);
    if (!liveMatch) return;
    const { form } = liveMatch;
    const s1 = parseInt(form.score1), s2 = parseInt(form.score2);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) return alert("Ingresá un marcador válido");
    if (!form.team1Pair || !form.team2Pair) return alert("Seleccioná las dos parejas");
    const team1 = expandPair(form.team1Pair, tournament.pairs);
    const team2 = expandPair(form.team2Pair, tournament.pairs);
    const matchData = { team1, team2, score1: s1, score2: s2, date: form.date, duration_seconds: form.duration_seconds };

    const remaining = liveMatches.filter(m => m.id !== liveId);
    if (remaining.length === 0) localStorage.removeItem(getLiveKey(tournament.id));
    else                        localStorage.setItem(getLiveKey(tournament.id), JSON.stringify(remaining));
    setLiveMatches(remaining);

    // Sincronizar live_match en el servidor ANTES del reload para que el
    // tournament recargado no traiga el partido en curso viejo.
    const labels = remaining
      .filter(m => m.timer.startedAt !== null)
      .map(m => ({ ...resolveTeamLabels(m.form), phase: 'previa' }));
    await onSetLiveMatch?.(labels.length > 0 ? labels : null);

    await onAddMatch(matchData);
  }

  async function handleSaveEdit() {
    if (!editId || !editForm) return;
    const s1 = parseInt(editForm.score1), s2 = parseInt(editForm.score2);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) return alert("Ingresá un marcador válido");
    if (!editForm.team1Pair || !editForm.team2Pair) return alert("Seleccioná las dos parejas");
    const team1 = expandPair(editForm.team1Pair, tournament.pairs);
    const team2 = expandPair(editForm.team2Pair, tournament.pairs);
    await onEditMatch(editId, { team1, team2, score1: s1, score2: s2, date: editForm.date });
    setEditId(null);
    setEditForm(null);
  }

  function handleEdit(m) {
    const pair1 = tournament.pairs?.find(
      p => (p.p1 === m.team1[0] && p.p2 === m.team1[1]) || (p.p1 === m.team1[1] && p.p2 === m.team1[0])
    );
    const pair2 = tournament.pairs?.find(
      p => (p.p1 === m.team2[0] && p.p2 === m.team2[1]) || (p.p1 === m.team2[1] && p.p2 === m.team2[0])
    );
    setEditForm({
      ...emptyForm(),
      team1Pair: pair1?.id ?? "",
      team2Pair: pair2?.id ?? "",
      score1: String(m.score1),
      score2: String(m.score2),
      date: m.date || localDateStr(),
    });
    setEditId(m.id);
  }

  async function handleDelete(id) {
    setConfirmDelete(id);
  }

  // ── Schedule generation ──────────────────────────────────────────────────────
  async function handleGenerateSchedule() {
    setGenerating(true);
    try {
      const sched = await onGenerateSchedule();
      setSchedule(sched);
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateBracket() {
    setGeneratingBracket(true);
    try { await onGenerateBracket(); }
    finally { setGeneratingBracket(false); }
  }

  // ── Derived state ────────────────────────────────────────────────────────────
  const allSchedulePlayed = schedule &&
    schedule.every(entry => findPlayedMatch(tournament, entry) !== null);

  const sorted = [...tournament.matches].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Contar PJ por pareja (usando el mismo matching de player IDs que findPlayedMatch)
  const pairMatchCounts = {};
  tournament.pairs.forEach(p => { pairMatchCounts[p.id] = 0; });
  tournament.matches.forEach(m => {
    const mt1 = new Set(m.team1);
    const mt2 = new Set(m.team2);
    for (const p of tournament.pairs) {
      const ps = new Set([p.p1, p.p2]);
      if (setsEqual(ps, mt1) || setsEqual(ps, mt2)) pairMatchCounts[p.id]++;
    }
  });

  // Tournament con solo las parejas que todavía pueden jugar (< 2 PJ)
  const tournamentForNewMatch = {
    ...tournament,
    pairs: tournament.pairs.filter(p => (pairMatchCounts[p.id] ?? 0) < 2),
  };

  return (
    <div>
      {confirmDelete && (
        <Modal
          title="Eliminar partido"
          message="¿Estás seguro que querés eliminar este partido? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          confirmDanger
          onConfirm={async () => { setConfirmDelete(null); await onDeleteMatch(confirmDelete); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted">FASE PREVIA</div>
        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={handleGenerateSchedule}
              disabled={generating}
              className="bg-transparent text-muted border border-border-strong px-3 py-2.5 font-condensed font-bold text-[12px] tracking-wide cursor-pointer rounded-sm disabled:opacity-50 whitespace-nowrap"
            >
              {generating ? '...' : '↺ AL AZAR'}
            </button>
            <button
              onClick={() => addNewMatch()}
              className="bg-brand text-base border-0 px-5 py-2.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer rounded-sm whitespace-nowrap"
            >
              + NUEVO PARTIDO
            </button>
          </div>
        )}
      </div>

      {/* Schedule guide */}
      {schedule && (
        <div className="mb-5 bg-surface border border-border-mid rounded-lg overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-2.5 cursor-pointer"
            onClick={() => setShowSchedule(v => !v)}
          >
            <div className="text-[11px] tracking-[2px] text-brand font-mono">CALENDARIO SUGERIDO</div>
            <span className="text-muted text-[11px] font-mono">{showSchedule ? '▲' : '▼'}</span>
          </div>
          {showSchedule && (
            <div className="border-t border-border px-4 pb-3 pt-2">
              {[...new Set(schedule.map(e => e.round))].sort().map(round => (
                <div key={round}>
                  <div className="text-[10px] tracking-[1px] text-muted font-mono mb-1.5 mt-2">RONDA {round}</div>
                  <div className="flex flex-col gap-1.5">
                    {schedule.filter(e => e.round === round).map(entry => {
                      const played  = findPlayedMatch(tournament, entry);
                      const key     = `${entry.team1.id}_${entry.team2.id}_r${entry.round}`;
                      const win1    = played && parseInt(played.score1) > parseInt(played.score2);
                      const canLoad = !played
                        && (pairMatchCounts[entry.team1.id] ?? 0) < 2
                        && (pairMatchCounts[entry.team2.id] ?? 0) < 2;
                      return (
                        <div key={key} className="flex items-center gap-2 py-1.5">
                          <span className={`flex-1 font-condensed font-semibold text-[14px] ${played ? (win1 ? 'text-brand' : 'text-muted') : 'text-white'}`}>
                            {entry.team1.name}
                          </span>
                          {played ? (
                            <span className="font-condensed font-black text-[17px] flex items-center gap-1 shrink-0">
                              <span className={win1 ? 'text-brand' : 'text-muted'}>{played.score1}</span>
                              <span className="text-border-strong text-[13px]">—</span>
                              <span className={!win1 ? 'text-cyan' : 'text-muted'}>{played.score2}</span>
                            </span>
                          ) : (
                            <>
                              <span className="text-border-strong font-condensed text-[13px] shrink-0">vs</span>
                              {isOwner && canLoad && (
                                <button
                                  onClick={() => addNewMatch({ team1Pair: entry.team1.id, team2Pair: entry.team2.id })}
                                  className="shrink-0 bg-surface-alt border border-border-strong text-muted px-2 py-0.5 font-condensed font-bold text-[11px] tracking-wide cursor-pointer rounded-sm hover:text-white"
                                >
                                  + cargar
                                </button>
                              )}
                            </>
                          )}
                          <span className={`flex-1 font-condensed font-semibold text-[14px] text-right ${played ? (!win1 ? 'text-cyan' : 'text-muted') : 'text-white'}`}>
                            {entry.team2.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      {editId && editForm && (
        <MatchForm
          form={editForm} setForm={setEditForm}
          tournament={tournament}
          onSave={handleSaveEdit}
          onCancel={() => { setEditId(null); setEditForm(null); }}
          isEditing={true}
          timerState={EMPTY_TIMER}
          onTimerChange={() => {}}
        />
      )}

      {/* Live match forms */}
      {liveMatches.map(liveMatch => (
        <MatchForm
          key={liveMatch.id}
          form={liveMatch.form}
          setForm={updater => handleFormChange(liveMatch.id, updater)}
          tournament={tournamentForNewMatch}
          onSave={() => handleSaveMatch(liveMatch.id)}
          onCancel={() => handleCancelMatch(liveMatch.id)}
          isEditing={false}
          timerState={liveMatch.timer}
          onTimerChange={newTimer => handleTimerChange(liveMatch.id, newTimer)}
        />
      ))}

      {/* Match list */}
      {sorted.length === 0 && liveMatches.length === 0 ? (
        <div className="text-center text-dim py-10 px-5 font-sans leading-loose">
          No hay partidos registrados todavía.<br />
          {isOwner ? 'Usá "AL AZAR" para generar el calendario o "+ NUEVO PARTIDO" para agregar uno manualmente.' : '¡Pronto habrá resultados!'}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((m, i) => (
            <MatchCard key={m.id} match={m} tournament={tournament} isOwner={isOwner}
              onEdit={() => handleEdit(m)} onDelete={() => handleDelete(m.id)}
              matchNum={sorted.length - i} />
          ))}
        </div>
      )}

      {/* Generate bracket */}
      {isOwner && !tournament.bracket && (allSchedulePlayed || !schedule) && tournament.matches.length > 0 && (
        <button
          onClick={handleGenerateBracket}
          disabled={generatingBracket}
          className="w-full bg-brand text-base border-0 py-3.5 font-condensed font-black text-[16px] tracking-[2px] rounded-sm mt-6 cursor-pointer disabled:opacity-60"
        >
          {generatingBracket ? 'GENERANDO...' : 'GENERAR CUADRO'}
        </button>
      )}
      {tournament.bracket && (
        <div className="bg-surface-alt border border-border-strong rounded-md px-3.5 py-2.5 text-[12px] text-brand font-mono mt-4 text-center">
          ✓ Cuadro de eliminación generado — miralo en la pestaña CUADRO
        </div>
      )}
    </div>
  );
}

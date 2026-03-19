/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { expandPair, emptyForm, localDateStr, getPairLabel } from "../../utils/helpers";
import MatchCard from "./MatchCard";
import MatchForm from "./MatchForm";

const EMPTY_TIMER = { startedAt: null, stoppedAt: null };
const getLiveKey  = (id) => `live_${id}`;
const genId       = () => Math.random().toString(36).slice(2, 7);

export default function Matches({ tournament, isOwner, onAddMatch, onEditMatch, onDeleteMatch, onSetLiveMatch }) {
  const isPairs = tournament.mode === "pairs";

  // Array de partidos en progreso: [{ id, form, timer }, ...]
  const [liveMatches, setLiveMatches] = useState(() => {
    try {
      const raw = localStorage.getItem(getLiveKey(tournament.id));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Backward compat: formato viejo era un objeto único { form, timer }
      if (!Array.isArray(parsed)) return [{ id: genId(), ...parsed }];
      return parsed;
    } catch { return []; }
  });

  // Partido en edición (separado de los live)
  const [editId,   setEditId]   = useState(null);
  const [editForm, setEditForm] = useState(null);

  // Persistir a localStorage
  useEffect(() => {
    const key = getLiveKey(tournament.id);
    if (liveMatches.length > 0) {
      localStorage.setItem(key, JSON.stringify(liveMatches));
    } else {
      localStorage.removeItem(key);
    }
  }, [liveMatches, tournament.id]);

  // Detectar cuándo arranca un timer y actualizar live_match en el servidor
  const prevLiveRef = useRef(liveMatches);
  
  function resolveTeamLabels(form) {
    const { mode, players, pairs } = tournament;
    if (mode === "pairs") {
      return {
        team1Label: getPairLabel(form.team1Pair, pairs, players),
        team2Label: getPairLabel(form.team2Pair, pairs, players),
      };
    }
    const res = (ids) => ids.map((id) => players.find((p) => p.id === id)?.name ?? "?").join(" & ");
    return { team1Label: res(form.team1), team2Label: res(form.team2) };
  }
  useEffect(() => {
    const prev = prevLiveRef.current;
    const newlyStarted = liveMatches.some((m) => {
      const prevMatch = prev.find((p) => p.id === m.id);
      const wasIdle   = !prevMatch?.timer.startedAt;
      const nowRunning = m.timer.startedAt !== null && !m.timer.stoppedAt;
      return wasIdle && nowRunning;
    });
    if (newlyStarted) {
      const labels = liveMatches
        .filter((m) => m.timer.startedAt !== null)
        .map((m) => resolveTeamLabels(m.form));
      onSetLiveMatch?.(labels.length > 0 ? labels : null);
    }
    prevLiveRef.current = liveMatches;
  }, [liveMatches]);

  function handleTimerChange(liveId, newTimerState) {
    setLiveMatches((prev) =>
      prev.map((m) => (m.id === liveId ? { ...m, timer: newTimerState } : m))
    );
  }

  function handleFormChange(liveId, updater) {
    setLiveMatches((prev) =>
      prev.map((m) => {
        if (m.id !== liveId) return m;
        const newForm = typeof updater === "function" ? updater(m.form) : updater;
        return { ...m, form: newForm };
      })
    );
  }

  function addNewMatch() {
    setLiveMatches((prev) => [...prev, { id: genId(), form: emptyForm(), timer: EMPTY_TIMER }]);
  }

  function handleCancelMatch(liveId) {
    setLiveMatches((prev) => {
      const remaining = prev.filter((m) => m.id !== liveId);
      const labels = remaining
        .filter((m) => m.timer.startedAt !== null)
        .map((m) => resolveTeamLabels(m.form));
      onSetLiveMatch?.(labels.length > 0 ? labels : null);
      return remaining;
    });
  }

  async function handleSaveMatch(liveId) {
    const liveMatch = liveMatches.find((m) => m.id === liveId);
    if (!liveMatch) return;
    const { form } = liveMatch;
    const s1 = parseInt(form.score1), s2 = parseInt(form.score2);

    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) return alert("Ingresá un marcador válido");

    let team1, team2;
    if (isPairs) {
      if (!form.team1Pair || !form.team2Pair) return alert("Seleccioná las dos parejas");
      team1 = expandPair(form.team1Pair, tournament.pairs);
      team2 = expandPair(form.team2Pair, tournament.pairs);
    } else {
      team1 = form.team1; team2 = form.team2;
      if (!team1[0] || !team1[1] || !team2[0] || !team2[1]) return alert("Completá los 4 jugadores");
      if (new Set([...team1, ...team2]).size !== 4) return alert("Los jugadores no pueden repetirse");
    }

    const matchData = { team1, team2, score1: s1, score2: s2, date: form.date, duration_seconds: form.duration_seconds };

    // ─── Fix bug: limpiar localStorage ANTES del await para evitar restore en remount ───
    const remaining = liveMatches.filter((m) => m.id !== liveId);
    if (remaining.length === 0) {
      localStorage.removeItem(getLiveKey(tournament.id));
    } else {
      localStorage.setItem(getLiveKey(tournament.id), JSON.stringify(remaining));
    }
    setLiveMatches(remaining);

    await onAddMatch(matchData);

    const labels = remaining
      .filter((m) => m.timer.startedAt !== null)
      .map((m) => resolveTeamLabels(m.form));
    onSetLiveMatch?.(labels.length > 0 ? labels : null);
  }

  async function handleSaveEdit() {
    if (!editId || !editForm) return;
    const s1 = parseInt(editForm.score1), s2 = parseInt(editForm.score2);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) return alert("Ingresá un marcador válido");

    let team1, team2;
    if (isPairs) {
      if (!editForm.team1Pair || !editForm.team2Pair) return alert("Seleccioná las dos parejas");
      team1 = expandPair(editForm.team1Pair, tournament.pairs);
      team2 = expandPair(editForm.team2Pair, tournament.pairs);
    } else {
      team1 = editForm.team1; team2 = editForm.team2;
      if (!team1[0] || !team1[1] || !team2[0] || !team2[1]) return alert("Completá los 4 jugadores");
      if (new Set([...team1, ...team2]).size !== 4) return alert("Los jugadores no pueden repetirse");
    }

    await onEditMatch(editId, { team1, team2, score1: s1, score2: s2, date: editForm.date });
    setEditId(null);
    setEditForm(null);
  }

  function handleEdit(m) {
    if (isPairs) {
      const pair1 = tournament.pairs?.find(
        (p) => (p.p1 === m.team1[0] && p.p2 === m.team1[1]) || (p.p1 === m.team1[1] && p.p2 === m.team1[0])
      );
      const pair2 = tournament.pairs?.find(
        (p) => (p.p1 === m.team2[0] && p.p2 === m.team2[1]) || (p.p1 === m.team2[1] && p.p2 === m.team2[0])
      );
      setEditForm({ ...emptyForm(), team1Pair: pair1?.id ?? "", team2Pair: pair2?.id ?? "",
        score1: String(m.score1), score2: String(m.score2), date: m.date || localDateStr() });
    } else {
      setEditForm({ team1: [...m.team1], team2: [...m.team2],
        score1: String(m.score1), score2: String(m.score2), date: m.date || localDateStr() });
    }
    setEditId(m.id);
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar este partido?")) return;
    await onDeleteMatch(id);
  }

  const sorted = [...tournament.matches].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted">PARTIDOS</div>
        {isOwner && (
          <button
            onClick={addNewMatch}
            className="bg-brand text-base border-0 px-5 py-2.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer rounded-sm whitespace-nowrap"
          >
            + NUEVO PARTIDO
          </button>
        )}
      </div>

      {/* Formulario de edición */}
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

      {/* Formularios de partidos en progreso */}
      {liveMatches.map((liveMatch) => (
        <MatchForm
          key={liveMatch.id}
          form={liveMatch.form}
          setForm={(updater) => handleFormChange(liveMatch.id, updater)}
          tournament={tournament}
          onSave={() => handleSaveMatch(liveMatch.id)}
          onCancel={() => handleCancelMatch(liveMatch.id)}
          isEditing={false}
          timerState={liveMatch.timer}
          onTimerChange={(newTimer) => handleTimerChange(liveMatch.id, newTimer)}
        />
      ))}

      {sorted.length === 0 ? (
        <div className="text-center text-dim py-10 px-5 font-sans leading-loose">
          No hay partidos registrados todavía.<br />¡Jugá el primero!
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((m) => (
            <MatchCard key={m.id} match={m} tournament={tournament} isOwner={isOwner}
              onEdit={() => handleEdit(m)} onDelete={() => handleDelete(m.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

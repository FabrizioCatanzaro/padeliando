import { useState, useEffect, useRef, useCallback } from "react";
import { CircleStop, CirclePlay, Play, Trophy } from "lucide-react";
import { PairAvatar } from "../shared/PlayerAvatar";

// ── Chip de seed con color según posición ──────────────────────────────────────
const SEED_TONE = {
  1: "bg-amber-400 text-base",      // oro
  2: "bg-slate-300 text-base",       // plata
  3: "bg-[#cd7f32] text-white",      // bronce
};
function SeedChip({ seed }) {
  if (seed == null) return null;
  const tone = SEED_TONE[seed] ?? "bg-border-mid text-muted";
  return (
    <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-mono font-bold shrink-0 ${tone}`}>
      {seed}
    </span>
  );
}

const EMPTY_TIMER = { startedAt: null, stoppedAt: null };
const getLiveKey  = (id) => `bracket_live_${id}`;

// ── Timer ──────────────────────────────────────────────────────────────────────
function Timer({ timerState = EMPTY_TIMER, onTimerChange, onStop }) {
  const running = timerState.startedAt !== null && timerState.stoppedAt === null;
  const stopped = timerState.startedAt !== null && timerState.stoppedAt !== null;
  const [liveSeconds, setLiveSeconds] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    clearInterval(ref.current);
    if (!running) return;
    ref.current = setInterval(() => {
      setLiveSeconds(Math.floor((Date.now() - timerState.startedAt) / 1000));
    }, 500);
    return () => clearInterval(ref.current);
  }, [running, timerState.startedAt]);

  const seconds = stopped
    ? Math.floor((timerState.stoppedAt - timerState.startedAt) / 1000)
    : running ? liveSeconds : 0;

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  function start()  { onTimerChange({ startedAt: Date.now(), stoppedAt: null }); }
  function stop()   {
    const now = Date.now();
    onTimerChange({ startedAt: timerState.startedAt, stoppedAt: now });
    onStop(Math.floor((now - timerState.startedAt) / 1000));
  }
  function resume() {
    const elapsed = timerState.stoppedAt - timerState.startedAt;
    onTimerChange({ startedAt: Date.now() - elapsed, stoppedAt: null });
    onStop(null);
  }

  if (!running && !stopped) {
    return (
      <div onClick={start} className="flex flex-row items-center justify-center gap-2 bg-brand text-base border-0 w-full py-2.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer rounded-sm mt-3">
        <Play size={13} /><span>INICIAR CRONÓMETRO</span>
      </div>
    );
  }
  if (running) {
    return (
      <div className="flex flex-row items-center gap-2 justify-center text-center my-3">
        <div className="font-mono text-[36px] text-brand tracking-[6px]">{mm}:{ss}</div>
        <CircleStop onClick={stop} size={30} className="bg-brand rounded-4xl items-center text-black cursor-pointer" />
      </div>
    );
  }
  return (
    <div className="flex flex-row items-center gap-2 justify-center text-center my-3">
      <div className="font-mono text-[36px] text-green tracking-[6px]">{mm}:{ss}</div>
      <CirclePlay onClick={resume} size={30} className="bg-green rounded-4xl items-center text-black cursor-pointer" />
    </div>
  );
}

// ── ScoreCounter ───────────────────────────────────────────────────────────────
function ScoreCounter({ value, onChange, color = "text-brand" }) {
  const num = Number(value);
  return (
    <div className="flex items-center gap-2.5 justify-center">
      <button
        className="w-10 h-10 rounded-sm border border-border-strong bg-border-mid text-white text-[22px] cursor-pointer flex items-center justify-center"
        onClick={() => onChange(Math.max(0, num - 1))}
      >−</button>
      <span className={`font-mono text-[34px] min-w-10 text-center font-bold ${color}`}>{num}</span>
      <button
        className={`w-10 h-10 rounded-sm border bg-border-mid text-[22px] flex items-center justify-center ${color} border-current ${num >= 7 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={() => onChange(Math.min(7, num + 1))}
        disabled={num >= 7}
      >+</button>
    </div>
  );
}

// ── Tarjeta de partido del bracket (sólo display + toggle EN VIVO) ─────────────
function BracketMatchCard({
  match, phase, isOwner, standings,
  editMode, draftMatch, allPairs, onPairChange,
  isLive, onToggleLive,
}) {
  const isTBD1   = !match.pair1_name;
  const isTBD2   = !match.pair2_name;
  const isPlayed = match.winner_id !== null;

  const seed1 = standings?.find(s => s.pair_id === match.pair1_id)?.seed ?? null;
  const seed2 = standings?.find(s => s.pair_id === match.pair2_id)?.seed ?? null;

  if (editMode) {
    const dm = draftMatch ?? match;
    return (
      <div className="bg-surface border border-brand/40 rounded-lg p-3">
        <select
          value={dm.pair1_id ?? ''}
          onChange={e => onPairChange(phase, match.id, 'pair1', e.target.value)}
          className="w-full bg-base border border-border-mid text-content px-2 py-1.5 font-sans text-[12px] rounded-sm outline-none mb-1"
        >
          <option value="">— Seleccionar pareja —</option>
          {allPairs.map(p => (
            <option key={p.pair_id} value={p.pair_id}>#{p.seed} {p.pair_name}</option>
          ))}
        </select>
        <div className="border-t border-border my-1" />
        <select
          value={dm.pair2_id ?? ''}
          onChange={e => onPairChange(phase, match.id, 'pair2', e.target.value)}
          className="w-full bg-base border border-border-mid text-content px-2 py-1.5 font-sans text-[12px] rounded-sm outline-none mt-1"
        >
          <option value="">— Seleccionar pareja —</option>
          {allPairs.map(p => (
            <option key={p.pair_id} value={p.pair_id}>#{p.seed} {p.pair_name}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`bg-surface border rounded-lg p-3 ${isLive ? 'border-green/50' : 'border-border-mid'}`}>
      {/* Pareja 1 */}
      <div className={`flex items-center justify-between py-1 px-1 rounded-sm ${isPlayed && match.winner_id === match.pair1_id ? "bg-brand/10" : ""}`}>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <SeedChip seed={seed1} />
          <span className={`font-condensed font-semibold text-[14px] truncate ${
            isTBD1 ? "text-muted italic" :
            isPlayed && match.winner_id === match.pair1_id ? "text-brand" : "text-white"
          }`}>
            {isTBD1 ? "TBD" : match.pair1_name}
          </span>
        </div>
        {isPlayed && (
          <span className={`font-mono font-bold text-[18px] ml-2 shrink-0 ${
            match.winner_id === match.pair1_id ? "text-brand" : "text-muted"
          }`}>{match.score1}</span>
        )}
      </div>

      <div className="border-t border-border my-1" />

      {/* Pareja 2 */}
      <div className={`flex items-center justify-between py-1 px-1 rounded-sm ${isPlayed && match.winner_id === match.pair2_id ? "bg-brand/10" : ""}`}>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <SeedChip seed={seed2} />
          <span className={`font-condensed font-semibold text-[14px] truncate ${
            isTBD2 ? "text-muted italic" :
            isPlayed && match.winner_id === match.pair2_id ? "text-brand" : "text-white"
          }`}>
            {isTBD2 ? "TBD" : match.pair2_name}
          </span>
        </div>
        {isPlayed && (
          <span className={`font-mono font-bold text-[18px] ml-2 shrink-0 ${
            match.winner_id === match.pair2_id ? "text-brand" : "text-muted"
          }`}>{match.score2}</span>
        )}
      </div>

      {/* Toggle EN VIVO */}
      {isOwner && !isPlayed && !isTBD1 && !isTBD2 && (
        <div className="mt-2.5">
          <button
            onClick={onToggleLive}
            className={`w-full border py-1 font-condensed font-bold text-[11px] tracking-wide cursor-pointer rounded-sm transition-colors ${
              isLive
                ? 'bg-green/10 text-green border-green/40'
                : 'bg-transparent text-muted border-dashed border-border-strong hover:text-white hover:border-border-mid'
            }`}
          >
            {isLive ? '● EN VIVO' : '◌ EN VIVO'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tarjeta "BYE" para parejas que pasan directo a cuartos ────────────────────
function BracketByeCard({ bye }) {
  return (
    <div className="bg-surface/40 border border-dashed border-border-mid rounded-lg p-3 opacity-75">
      <div className="flex items-center gap-1.5 py-1 px-1 min-w-0">
        <SeedChip seed={bye.seed} />
        <span className="font-condensed font-semibold text-[14px] truncate text-soft">
          {bye.pair_name ?? "—"}
        </span>
      </div>
      <div className="mt-1.5 text-[9px] tracking-[2px] text-muted/60 font-mono text-center">
        PASA DIRECTO
      </div>
    </div>
  );
}

// ── Card de partido EN VIVO (debajo del cuadro) ────────────────────────────────
function BracketLiveCard({ liveMatch, bracketMatch, saving, onScoreChange, onSave, onCancel, onTimerChange }) {
  const timerDone = liveMatch.timer.startedAt !== null && liveMatch.timer.stoppedAt !== null;
  const { score1, score2 } = liveMatch.score;

  return (
    <div className="bg-surface border border-green/40 rounded-lg p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-green font-mono text-[11px] font-bold tracking-wide">● EN VIVO</span>
        <button
          onClick={onCancel}
          className="bg-transparent border-0 text-muted cursor-pointer font-sans text-[13px] hover:text-white"
        >
          ✕ Cancelar
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="font-condensed font-bold text-[16px] text-brand flex-1">{bracketMatch.pair1_name}</span>
        <span className="text-muted font-condensed font-bold text-[14px] px-3">VS</span>
        <span className="font-condensed font-bold text-[16px] text-cyan flex-1 text-right">{bracketMatch.pair2_name}</span>
      </div>

      <div className="flex gap-4 justify-center items-center">
        <ScoreCounter value={score1} onChange={v => onScoreChange('score1', v)} color="text-brand" />
        <span className="text-muted font-mono text-[20px]">—</span>
        <ScoreCounter value={score2} onChange={v => onScoreChange('score2', v)} color="text-cyan" />
      </div>

      <Timer
        timerState={liveMatch.timer}
        onTimerChange={onTimerChange}
        onStop={secs => onScoreChange('duration_seconds', secs)}
      />

      <button
        onClick={onSave}
        disabled={saving || Number(score1) === Number(score2) || !timerDone}
        className={`w-full border-0 py-2.5 font-condensed font-bold text-[13px] tracking-wide rounded-sm mt-2 ${
          saving || Number(score1) === Number(score2) || !timerDone
            ? "bg-border-mid text-muted cursor-not-allowed"
            : "bg-brand text-base cursor-pointer"
        }`}
      >
        {saving ? "REGISTRANDO..." : "REGISTRAR PARTIDO"}
      </button>
    </div>
  );
}

// ── Card de partido jugado del bracket ────────────────────────────────────────
function BracketPlayedCard({ match, isOwner, onEdit, matchNum }) {
  const win1 = match.winner_id === match.pair1_id;
  return (
    <div className="bg-surface border border-border-mid rounded-lg px-4 py-3.5">
      <div className="flex items-center gap-3 flex-wrap">
        {matchNum != null && (
          <span className="text-[10px] font-mono text-muted shrink-0 w-3 text-right">#{matchNum}</span>
        )}
        <div className={`flex-1 font-condensed font-semibold text-xl ${win1 ? "text-brand" : "text-secondary"}`}>
          {match.pair1_name}
        </div>
        <div className="flex items-center gap-2 font-condensed font-black text-[28px] min-w-20 justify-center">
          <span className={win1 ? "text-brand" : "text-secondary"}>{match.score1}</span>
          <span className="text-border-strong text-[20px]">—</span>
          <span className={!win1 ? "text-cyan" : "text-secondary"}>{match.score2}</span>
        </div>
        <div className={`flex-1 font-condensed font-semibold text-xl text-right ${!win1 ? "text-cyan" : "text-secondary"}`}>
          {match.pair2_name}
        </div>
      </div>
      {isOwner && (
        <div className="mt-2.5 pt-2.5 border-t border-border-mid">
          <button
            onClick={onEdit}
            className="bg-transparent border-0 text-muted cursor-pointer text-[12px] font-sans px-1.5 py-0.5 flex items-center gap-1.5 hover:text-white"
          >
            ✎ Editar resultado
          </button>
        </div>
      )}
    </div>
  );
}

// ── Formulario de edición de resultado jugado ──────────────────────────────────
function BracketEditCard({ match, saving, editScore, onScoreChange, onSave, onCancel }) {
  const s1 = Number(editScore.score1), s2 = Number(editScore.score2);
  return (
    <div className="bg-surface border border-brand/40 rounded-lg p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-brand font-mono text-[11px] font-bold tracking-wide">✎ EDITAR RESULTADO</span>
        <button onClick={onCancel} className="bg-transparent border-0 text-muted cursor-pointer font-sans text-[13px] hover:text-white">
          ✕ Cancelar
        </button>
      </div>
      <div className="flex justify-between items-center mb-4">
        <span className="font-condensed font-bold text-[16px] text-brand flex-1">{match.pair1_name}</span>
        <span className="text-muted font-condensed font-bold text-[14px] px-3">VS</span>
        <span className="font-condensed font-bold text-[16px] text-cyan flex-1 text-right">{match.pair2_name}</span>
      </div>
      <div className="flex gap-4 justify-center items-center">
        <ScoreCounter value={s1} onChange={v => onScoreChange('score1', v)} color="text-brand" />
        <span className="text-muted font-mono text-[20px]">—</span>
        <ScoreCounter value={s2} onChange={v => onScoreChange('score2', v)} color="text-cyan" />
      </div>
      <button
        onClick={onSave}
        disabled={saving || s1 === s2}
        className={`w-full border-0 py-2.5 font-condensed font-bold text-[13px] tracking-wide rounded-sm mt-4 ${
          saving || s1 === s2 ? "bg-border-mid text-muted cursor-not-allowed" : "bg-brand text-base cursor-pointer"
        }`}
      >
        {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
      </button>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function Bracket({ tournament, isOwner, onGenerateBracket, onUpdateMatch, onSetBracket, onSetLiveMatch }) {
  const bracket = tournament.bracket;

  const [liveMatches,  setLiveMatches]  = useState(() => {
    try {
      const raw = localStorage.getItem(getLiveKey(tournament.id));
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  // Each entry: { matchId, timer: {...}, score: { score1, score2, duration_seconds } }

  const [saving,       setSaving]       = useState(null);
  const [generating,   setGenerating]   = useState(false);
  const [editMode,     setEditMode]     = useState(false);
  const [draftBracket, setDraftBracket] = useState(null);
  const [savingLayout, setSavingLayout] = useState(false);
  const [editMatchId,  setEditMatchId]  = useState(null);
  const [editScore,    setEditScore]    = useState({ score1: 0, score2: 0 });

  // Persist liveMatches + sync onSetLiveMatch
  const prevLiveRef = useRef(liveMatches);
  const findBracketMatchWithPhase = useCallback((matchId) => {
    if (!bracket) return null;
    if (bracket.final?.id === matchId) return { match: bracket.final, phase: 'final' };
    for (const phase of ['octavos', 'cuartos', 'semis']) {
      const found = bracket[phase]?.find(m => m.id === matchId);
      if (found) return { match: found, phase };
    }
    return null;
  }, [bracket]);

  useEffect(() => {
    const key = getLiveKey(tournament.id);
    if (liveMatches.length > 0) localStorage.setItem(key, JSON.stringify(liveMatches));
    else                        localStorage.removeItem(key);

    const prevIds = new Set(prevLiveRef.current.map(m => m.matchId));
    const currIds = new Set(liveMatches.map(m => m.matchId));
    const changed = prevIds.size !== currIds.size ||
      [...currIds].some(id => !prevIds.has(id)) ||
      [...prevIds].some(id => !currIds.has(id));
    if (changed) {
      const labels = liveMatches.map(lm => {
        const result = findBracketMatchWithPhase(lm.matchId);
        if (!result) return null;
        return { team1Label: result.match.pair1_name, team2Label: result.match.pair2_name, phase: result.phase };
      }).filter(Boolean);
      onSetLiveMatch?.(labels.length > 0 ? labels : null);
    }
    prevLiveRef.current = liveMatches;
  }, [liveMatches, tournament.id, findBracketMatchWithPhase, onSetLiveMatch]);

  function findBracketMatch(matchId) {
    return findBracketMatchWithPhase(matchId)?.match ?? null;
  }

  function handleToggleLive(matchId) {
    const existing = liveMatches.find(m => m.matchId === matchId);
    if (existing) {
      setLiveMatches(prev => prev.filter(m => m.matchId !== matchId));
    } else {
      setLiveMatches(prev => [...prev, {
        matchId,
        timer: EMPTY_TIMER,
        score: { score1: 0, score2: 0, duration_seconds: null },
      }]);
    }
  }

  function handleTimerChange(matchId, newTimer) {
    setLiveMatches(prev => prev.map(m => m.matchId === matchId ? { ...m, timer: newTimer } : m));
  }

  function handleScoreChange(matchId, field, value) {
    setLiveMatches(prev => prev.map(m =>
      m.matchId === matchId ? { ...m, score: { ...m.score, [field]: value } } : m
    ));
  }

  async function handleSaveResult(matchId) {
    const lm = liveMatches.find(m => m.matchId === matchId);
    if (!lm) return;
    const s1 = Number(lm.score.score1), s2 = Number(lm.score.score2);
    if (s1 === s2) return;
    // Cerrar la card ANTES del await para evitar que un remount restaure desde localStorage
    const remaining = liveMatches.filter(m => m.matchId !== matchId);
    setLiveMatches(remaining);
    const key = getLiveKey(tournament.id);
    if (remaining.length > 0) localStorage.setItem(key, JSON.stringify(remaining));
    else localStorage.removeItem(key);
    setSaving(matchId);
    try {
      await onUpdateMatch(matchId, s1, s2, lm.score.duration_seconds ?? null);
    } finally {
      setSaving(null);
    }
  }

  function handleOpenEdit(match) {
    setEditMatchId(match.id);
    setEditScore({ score1: match.score1, score2: match.score2 });
  }

  async function handleSaveEdit() {
    const s1 = Number(editScore.score1), s2 = Number(editScore.score2);
    if (s1 === s2) return;
    setSaving(editMatchId);
    try {
      await onUpdateMatch(editMatchId, s1, s2);
      setEditMatchId(null);
    } finally {
      setSaving(null);
    }
  }

  async function handleGenerateBracket() {
    setGenerating(true);
    try { await onGenerateBracket(); }
    finally { setGenerating(false); }
  }

  // ── Reorganizar ──────────────────────────────────────────────────────────────
  function enterEditMode()  { setDraftBracket(JSON.parse(JSON.stringify(bracket))); setEditMode(true); }
  function cancelEditMode() { setDraftBracket(null); setEditMode(false); }

  async function confirmEditMode() {
    setSavingLayout(true);
    try { await onSetBracket(draftBracket); setEditMode(false); setDraftBracket(null); }
    finally { setSavingLayout(false); }
  }

  function updateDraftPair(phaseKey, matchId, slot, pairId) {
    const pair = bracket.standings?.find(s => s.pair_id === pairId);
    setDraftBracket(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const match = phaseKey === 'final' ? next.final : next[phaseKey]?.find(m => m.id === matchId);
      if (!match) return prev;
      match[`${slot}_id`]   = pair?.pair_id   ?? null;
      match[`${slot}_name`] = pair?.pair_name ?? null;
      return next;
    });
  }

  function getDraftMatch(phaseKey, matchId) {
    if (!draftBracket) return null;
    if (phaseKey === 'final') return draftBracket.final;
    return draftBracket[phaseKey]?.find(m => m.id === matchId) ?? null;
  }

  // ── Sin bracket ──────────────────────────────────────────────────────────────
  if (!bracket) {
    return (
      <div>
        <div className="font-condensed font-bold text-[14px] tracking-[3px] text-muted mb-4">CUADRO</div>
        {isOwner ? (
          <>
            <p className="text-muted font-mono text-[12px] mb-4">
              Completá todos los partidos de la fase previa para generar el cuadro.
            </p>
            <button
              onClick={handleGenerateBracket}
              disabled={generating}
              className="w-full bg-brand text-base border-0 py-3.5 font-condensed font-black text-[16px] tracking-[2px] rounded-sm cursor-pointer disabled:opacity-60"
            >
              {generating ? "GENERANDO..." : "GENERAR CUADRO"}
            </button>
          </>
        ) : (
          <p className="text-muted font-mono text-[13px]">El cuadro aún no fue generado.</p>
        )}
      </div>
    );
  }

  const standings = bracket.standings ?? [];
  const hasResults = bracket.octavos?.some(m => m.winner_id) ||
                     bracket.cuartos?.some(m => m.winner_id) ||
                     bracket.semis?.some(m => m.winner_id)   ||
                     bracket.final?.winner_id;

  // Construye los 8 slots de octavos: reales + "byes" (parejas que pasan directo)
  // en el orden que dicta la pairing de cuartos, de modo que cada par de slots
  // alimente al mismo cuarto y el árbol quede balanceado.
  function buildOctavosSlots() {
    if (!bracket.octavos?.length) return null;
    const slots = [];
    for (const qm of bracket.cuartos) {
      for (const n of [1, 2]) {
        const src = qm[`slot${n}_source`];
        if (src) {
          const octavo = bracket.octavos.find(m => m.id === src);
          if (octavo) slots.push({ type: "match", data: octavo });
        } else {
          slots.push({
            type: "bye",
            data: {
              pair_id:   qm[`pair${n}_id`],
              pair_name: qm[`pair${n}_name`],
              seed:      qm[`slot${n}_seed`],
            },
          });
        }
      }
    }
    return slots;
  }

  const wrapMatches = (arr) => arr.map(m => ({ type: "match", data: m }));
  const octavosSlots = buildOctavosSlots();

  const phases = [
    octavosSlots
      ? { key: "octavos", label: "OCTAVOS",         items: octavosSlots }
      : null,
    { key: "cuartos", label: "CUARTOS DE FINAL", items: wrapMatches(bracket.cuartos) },
    { key: "semis",   label: "SEMIFINALES",     items: wrapMatches(bracket.semis)   },
    { key: "final",   label: "FINAL",           items: bracket.final ? wrapMatches([bracket.final]) : [] },
  ].filter(Boolean);

  // Partidos jugados del bracket (para mostrar como cards)
  const playedBracketMatches = phases
    .flatMap(p => p.items.filter(it => it.type === "match").map(it => it.data))
    .filter(m => m.winner_id !== null && m.pair1_name && m.pair2_name);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="font-condensed font-bold text-[14px] tracking-[3px] text-muted">CUADRO</div>
        {isOwner && !hasResults && !editMode && (
          <button
            onClick={enterEditMode}
            className="bg-transparent text-muted border border-border-strong px-3 py-2 font-condensed font-bold text-[12px] tracking-wide cursor-pointer rounded-sm"
          >
            ✎ REORGANIZAR
          </button>
        )}
        {editMode && (
          <div className="flex gap-2">
            <button onClick={cancelEditMode} className="bg-transparent text-muted border border-border-strong px-3 py-2 font-condensed font-bold text-[12px] cursor-pointer rounded-sm">
              CANCELAR
            </button>
            <button onClick={confirmEditMode} disabled={savingLayout} className="bg-brand text-base border-0 px-4 py-2 font-condensed font-bold text-[12px] tracking-wide cursor-pointer rounded-sm disabled:opacity-60">
              {savingLayout ? "..." : "CONFIRMAR"}
            </button>
          </div>
        )}
      </div>

      {editMode && (
        <div className="bg-surface-alt border border-brand/30 rounded-md px-3.5 py-2.5 text-[11px] text-brand font-mono mb-4">
          Modo reorganizar: asigná las parejas a cada cruce. Los cambios se aplican al confirmar.
        </div>
      )}

      {/* Momento campeón — solo cuando la final está definida y no estamos editando */}
      {!editMode && bracket.final?.winner_name && (() => {
        const winnerPair = tournament.pairs?.find((p) => p.id === bracket.final.winner_id);
        const wp1 = winnerPair ? tournament.players.find((p) => p.id === winnerPair.p1) : null;
        const wp2 = winnerPair ? tournament.players.find((p) => p.id === winnerPair.p2) : null;
        return (
        <div className="relative mb-6 overflow-hidden rounded-lg border border-amber-400/40 bg-gradient-to-b from-amber-400/15 via-amber-400/5 to-transparent p-6 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <Trophy size={36} className="mx-auto mb-2 text-amber-400" />
          <div className="font-mono text-[10px] tracking-[4px] text-amber-400/70 mb-1.5">CAMPEONES</div>
          {winnerPair && (
            <div className="flex justify-center mb-2">
              <PairAvatar
                name1={wp1?.name ?? "?"}
                name2={wp2?.name ?? "?"}
                src1={wp1?.linked_avatar_url ?? null}
                src2={wp2?.linked_avatar_url ?? null}
                size={56}
              />
            </div>
          )}
          <div className="font-condensed font-black text-[24px] text-white leading-tight">
            {bracket.final.winner_name}
          </div>
          {bracket.final.score1 != null && bracket.final.score2 != null && (
            <div className="mt-2 font-mono text-[11px] text-muted">
              Final: {Math.max(bracket.final.score1, bracket.final.score2)}
              <span className="text-border-strong mx-1.5">—</span>
              {Math.min(bracket.final.score1, bracket.final.score2)}
            </div>
          )}
        </div>
        );
      })()}

      {/* Bracket en columnas — altura mínima compartida para que cada columna
          distribuya sus cards con justify-around y se alineen como un árbol. */}
      <div className="overflow-x-auto">
        <div
          className="flex gap-10 min-w-max pb-4 items-stretch"
          style={{ minHeight: `${Math.max(...phases.map(p => p.items.length)) * 140}px` }}
        >
          {phases.map((phase, phaseIdx) => {
            const isFirst    = phaseIdx === 0;
            const isLast     = phaseIdx === phases.length - 1;
            const nextLen    = phases[phaseIdx + 1]?.items.length ?? 0;
            // shouldPair: el árbol es balanceado (esta columna dobla a la siguiente).
            // Con los byes virtuales, octavos siempre tiene 8 items y cuartos 4.
            const shouldPair = !isLast && phase.items.length === 2 * nextLen;

            const renderItem = (item, idx) => {
              const key = item.type === "match" ? item.data.id : `bye-${phase.key}-${idx}`;
              return (
                <div key={key} className="relative">
                  {item.type === "match" ? (
                    <BracketMatchCard
                      match={item.data}
                      phase={phase.key}
                      isOwner={isOwner}
                      standings={standings}
                      editMode={editMode}
                      draftMatch={getDraftMatch(phase.key, item.data.id)}
                      allPairs={standings}
                      onPairChange={updateDraftPair}
                      isLive={liveMatches.some(lm => lm.matchId === item.data.id)}
                      onToggleLive={() => handleToggleLive(item.data.id)}
                    />
                  ) : (
                    <BracketByeCard bye={item.data} />
                  )}
                </div>
              );
            };

            // Líneas fijas al 25%/75% del pair-group — independiente de la altura real
            // de cada card, así mixing bye (más bajo) + match (más alto) no desalinea.
            const connectorRight = !isLast && (
              <>
                <span className="absolute left-full top-1/4 -translate-y-1/2 w-5 h-px bg-border-mid pointer-events-none" />
                <span className="absolute left-full top-3/4 -translate-y-1/2 w-5 h-px bg-border-mid pointer-events-none" />
                <span className="absolute left-full top-1/4 bottom-1/4 ml-5 w-px bg-border-mid pointer-events-none" />
              </>
            );
            const connectorLeft = !isFirst && (
              <>
                <span className="absolute right-full top-1/4 -translate-y-1/2 w-5 h-px bg-border-mid pointer-events-none" />
                <span className="absolute right-full top-3/4 -translate-y-1/2 w-5 h-px bg-border-mid pointer-events-none" />
              </>
            );

            return (
              <div key={phase.key} className={`flex flex-col ${editMode ? "w-56" : "w-52"} shrink-0`}>
                <div className="text-[10px] tracking-[2px] text-brand font-mono text-center mb-3">
                  {phase.label}
                </div>
                {shouldPair ? (
                  <div className="flex flex-col flex-1 justify-around">
                    {Array.from({ length: phase.items.length / 2 }).map((_, gi) => (
                      <div
                        key={gi}
                        className="relative flex flex-col justify-around flex-1"
                      >
                        {renderItem(phase.items[gi * 2], gi * 2)}
                        {renderItem(phase.items[gi * 2 + 1], gi * 2 + 1)}
                        {connectorRight}
                        {connectorLeft}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`relative flex flex-col flex-1 ${phase.items.length === 1 ? "justify-center" : "justify-around"}`}>
                    {phase.items.map(renderItem)}
                    {/* Final (1 ítem): tick al 50% del contenedor */}
                    {!isFirst && phase.items.length === 1 && (
                      <span className="absolute right-full top-1/2 -translate-y-1/2 w-5 h-px bg-border-mid pointer-events-none" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cards EN VIVO (debajo del cuadro) */}
      {liveMatches.length > 0 && (
        <div className="mt-6">
          <div className="font-condensed font-bold text-[12px] tracking-[3px] text-muted mb-3">PARTIDOS EN CURSO</div>
          {liveMatches.map(lm => {
            const bracketMatch = findBracketMatch(lm.matchId);
            if (!bracketMatch) return null;
            return (
              <BracketLiveCard
                key={lm.matchId}
                liveMatch={lm}
                bracketMatch={bracketMatch}
                saving={saving === lm.matchId}
                onScoreChange={(field, value) => handleScoreChange(lm.matchId, field, value)}
                onSave={() => handleSaveResult(lm.matchId)}
                onCancel={() => handleToggleLive(lm.matchId)}
                onTimerChange={newTimer => handleTimerChange(lm.matchId, newTimer)}
              />
            );
          })}
        </div>
      )}

      {/* Partidos jugados del bracket */}
      
      {playedBracketMatches.length > 0 && (
        <div className="mt-6">
          <div className="font-condensed font-bold text-[12px] tracking-[3px] text-muted mb-3">RESULTADOS</div>
          <div className="flex flex-col gap-2.5">
            {[...playedBracketMatches].reverse().map((m, i) => {
              const matchNum = playedBracketMatches.length - i;
              return editMatchId === m.id ? (
                <BracketEditCard
                  key={m.id}
                  match={m}
                  saving={saving === m.id}
                  editScore={editScore}
                  onScoreChange={(field, value) => setEditScore(prev => ({ ...prev, [field]: value }))}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditMatchId(null)}
                />
              ) : (
                <BracketPlayedCard key={m.id} match={m} isOwner={isOwner} onEdit={() => handleOpenEdit(m)} matchNum={matchNum} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

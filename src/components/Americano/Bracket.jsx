import { useState } from "react";

// ── Contador +/- ───────────────────────────────────────────────────────────────
function ScoreCounter({ value, onChange, color = "text-brand" }) {
  const num = Number(value);
  return (
    <div className="flex items-center gap-1 justify-center">
      <button
        onClick={() => onChange(Math.max(0, num - 1))}
        className="w-5 h-5 rounded-sm border border-border-strong bg-border-mid text-white text-[14px] cursor-pointer flex items-center justify-center leading-none"
      >−</button>
      <span className={`font-mono text-[28px] min-w-5 text-center font-bold ${color}`}>{num}</span>
      <button
        onClick={() => onChange(Math.min(7, num + 1))}
        className={`w-5 h-5 rounded-sm border bg-border-mid text-[14px] flex items-center justify-center leading-none ${color} border-current ${num >= 7 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
        disabled={num >= 7}
      >+</button>
    </div>
  );
}

// ── Tarjeta de partido del bracket ────────────────────────────────────────────
function BracketMatchCard({
  match, phase, isOwner, saving,
  activeFormId, onOpenForm, onCloseForm,
  inlineScore, onScoreChange, onSave,
  standings,
  editMode, draftMatch, allPairs, onPairChange,
  isLive, onToggleLive,
}) {
  const isTBD1   = !match.pair1_name;
  const isTBD2   = !match.pair2_name;
  const isPlayed = match.winner_id !== null;
  const showForm = activeFormId === match.id;

  const seed1 = standings?.find(s => s.pair_id === match.pair1_id)?.seed ?? null;
  const seed2 = standings?.find(s => s.pair_id === match.pair2_id)?.seed ?? null;

  // En modo reorganizar: mostrar dropdowns para pares no determinados por ronda anterior
  if (editMode) {
    const dm = draftMatch ?? match;
    return (
      <div className="bg-surface border border-brand/40 rounded-lg p-3">
        {/* Slot 1 */}
        <select
          value={dm.pair1_id ?? ''}
          onChange={e => onPairChange(phase, match.id, 'pair1', e.target.value)}
          className="w-full bg-base border border-border-mid text-content px-2 py-1.5 font-sans text-[12px] rounded-sm outline-none mb-1"
        >
          <option value="">— Seleccionar pareja —</option>
          {allPairs.map(p => (
            <option key={p.pair_id} value={p.pair_id}>
              #{p.seed} {p.pair_name}
            </option>
          ))}
        </select>
        <div className="border-t border-border my-1" />
        {/* Slot 2 */}
        <select
          value={dm.pair2_id ?? ''}
          onChange={e => onPairChange(phase, match.id, 'pair2', e.target.value)}
          className="w-full bg-base border border-border-mid text-content px-2 py-1.5 font-sans text-[12px] rounded-sm outline-none mt-1"
        >
          <option value="">— Seleccionar pareja —</option>
          {allPairs.map(p => (
            <option key={p.pair_id} value={p.pair_id}>
              #{p.seed} {p.pair_name}
            </option>
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
          {seed1 && <span className="text-[10px] font-mono text-muted shrink-0">#{seed1}</span>}
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
          {seed2 && <span className="text-[10px] font-mono text-muted shrink-0">#{seed2}</span>}
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

      {/* Acciones del owner */}
      {isOwner && !isPlayed && !isTBD1 && !isTBD2 && (
        <div className="mt-2.5 flex flex-col gap-1.5">
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
          {showForm ? (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-center gap-3 mb-3">
                <ScoreCounter
                  value={inlineScore?.score1 ?? 0}
                  onChange={v => onScoreChange(match.id, 'score1', v)}
                  color="text-brand"
                />
                <span className="text-muted font-mono text-[18px]">—</span>
                <ScoreCounter
                  value={inlineScore?.score2 ?? 0}
                  onChange={v => onScoreChange(match.id, 'score2', v)}
                  color="text-cyan"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSave(match.id)}
                  disabled={saving || (inlineScore?.score1 ?? 0) === (inlineScore?.score2 ?? 0)}
                  className="flex-1 bg-brand text-base border-0 py-2 font-condensed font-bold text-[12px] tracking-wide cursor-pointer rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? "..." : "REGISTRAR"}
                </button>
                <button
                  onClick={onCloseForm}
                  className="bg-transparent text-muted border border-border-strong px-3 py-2 text-[11px] cursor-pointer rounded-sm font-sans"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onOpenForm(match.id)}
              className="w-full bg-transparent text-muted border border-dashed border-border-strong py-1.5 font-condensed font-bold text-[11px] tracking-wide cursor-pointer rounded-sm hover:text-white hover:border-border-mid transition-colors"
            >
              + RESULTADO
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function Bracket({ tournament, isOwner, onGenerateBracket, onUpdateMatch, onSetBracket, onSetLiveMatch }) {
  const bracket = tournament.bracket;

  const [inlineScores,   setInlineScores]   = useState({});
  const [saving,         setSaving]         = useState(null);
  const [activeFormId,   setActiveFormId]   = useState(null);
  const [generating,     setGenerating]     = useState(false);
  const [editMode,       setEditMode]       = useState(false);
  const [draftBracket,   setDraftBracket]   = useState(null);
  const [savingLayout,   setSavingLayout]   = useState(false);
  const [liveMatchId,    setLiveMatchId]    = useState(null);

  function handleToggleLive(matchId, pair1Name, pair2Name) {
    if (liveMatchId === matchId) {
      setLiveMatchId(null);
      onSetLiveMatch?.(null);
    } else {
      setLiveMatchId(matchId);
      onSetLiveMatch?.([{ team1Label: pair1Name, team2Label: pair2Name }]);
    }
  }

  async function handleGenerateBracket() {
    setGenerating(true);
    try { await onGenerateBracket(); }
    finally { setGenerating(false); }
  }

  async function handleSaveResult(matchId) {
    const score = inlineScores[matchId] ?? { score1: 0, score2: 0 };
    const s1 = Number(score.score1), s2 = Number(score.score2);
    if (s1 === s2) return;
    setSaving(matchId);
    try {
      await onUpdateMatch(matchId, s1, s2);
      setInlineScores(prev => { const n = { ...prev }; delete n[matchId]; return n; });
      setActiveFormId(null);
    } finally {
      setSaving(null);
    }
  }

  function handleScoreChange(matchId, field, value) {
    setInlineScores(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] ?? { score1: 0, score2: 0 }), [field]: value },
    }));
  }

  // ── Reorganizar ─────────────────────────────────────────────────────────────
  function enterEditMode() {
    setDraftBracket(JSON.parse(JSON.stringify(bracket)));
    setEditMode(true);
  }

  function cancelEditMode() {
    setDraftBracket(null);
    setEditMode(false);
  }

  async function confirmEditMode() {
    setSavingLayout(true);
    try {
      await onSetBracket(draftBracket);
      setEditMode(false);
      setDraftBracket(null);
    } finally {
      setSavingLayout(false);
    }
  }

  function updateDraftPair(phaseKey, matchId, slot, pairId) {
    const pair = bracket.standings?.find(s => s.pair_id === pairId);
    setDraftBracket(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let match;
      if (phaseKey === 'final') {
        match = next.final;
      } else {
        match = next[phaseKey]?.find(m => m.id === matchId);
      }
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

  const standings  = bracket.standings ?? [];
  const hasResults = bracket.octavos?.some(m => m.winner_id) ||
                     bracket.cuartos?.some(m => m.winner_id) ||
                     bracket.semis?.some(m => m.winner_id)   ||
                     bracket.final?.winner_id;

  const phases = [
    bracket.octavos?.length > 0
      ? { key: "octavos", label: "OCTAVOS",          matches: bracket.octavos }
      : null,
    { key: "cuartos", label: "CUARTOS DE FINAL",      matches: bracket.cuartos },
    { key: "semis",   label: "SEMIFINALES",            matches: bracket.semis   },
    { key: "final",   label: "FINAL",                  matches: bracket.final ? [bracket.final] : [] },
  ].filter(Boolean);

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
            <button
              onClick={cancelEditMode}
              className="bg-transparent text-muted border border-border-strong px-3 py-2 font-condensed font-bold text-[12px] cursor-pointer rounded-sm"
            >
              CANCELAR
            </button>
            <button
              onClick={confirmEditMode}
              disabled={savingLayout}
              className="bg-brand text-base border-0 px-4 py-2 font-condensed font-bold text-[12px] tracking-wide cursor-pointer rounded-sm disabled:opacity-60"
            >
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

      {/* Bracket en columnas */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4 items-start">
          {phases.map(phase => (
            <div key={phase.key} className={`flex flex-col gap-3 ${editMode ? "w-56" : "w-52"}`}>
              <div className="text-[10px] tracking-[2px] text-brand font-mono text-center mb-1">
                {phase.label}
              </div>
              <div className="flex flex-col gap-3">
                {phase.matches.map(match => (
                  <BracketMatchCard
                    key={match.id}
                    match={match}
                    phase={phase.key}
                    isOwner={isOwner}
                    saving={saving === match.id}
                    activeFormId={activeFormId}
                    onOpenForm={id => { setActiveFormId(id); setInlineScores(prev => ({ ...prev, [id]: prev[id] ?? { score1: 0, score2: 0 } })); }}
                    onCloseForm={() => setActiveFormId(null)}
                    inlineScore={inlineScores[match.id]}
                    onScoreChange={handleScoreChange}
                    onSave={handleSaveResult}
                    standings={standings}
                    editMode={editMode}
                    draftMatch={getDraftMatch(phase.key, match.id)}
                    allPairs={standings}
                    onPairChange={updateDraftPair}
                    isLive={liveMatchId === match.id}
                    onToggleLive={() => handleToggleLive(match.id, match.pair1_name, match.pair2_name)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

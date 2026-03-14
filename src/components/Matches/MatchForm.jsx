import { useState, useEffect, useRef } from "react";
import { getPairLabel } from "../../utils/helpers";

// ── Cronómetro ────────────────────────────────────────────────────────────────
function Timer({ onStop }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [stopped, setStopped] = useState(false);
  const ref = useRef(null);

  function start() {
    setRunning(true);
    setStopped(false);
    ref.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function stop() {
    clearInterval(ref.current);
    setRunning(false);
    setStopped(true);
    onStop(seconds);
  }

  function resume() {
    setRunning(true);
    setStopped(false);
    ref.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    onStop(null);
  }

  useEffect(() => () => clearInterval(ref.current), []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  if (!running && !stopped) {
    return (
      <button onClick={start} className="bg-brand text-base border-0 w-full py-2.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer rounded-sm mt-3">
        ▶ INICIAR PARTIDO
      </button>
    );
  }

  if (running) {
    return (
      <div className="text-center my-3">
        <div className="font-mono text-[36px] text-brand tracking-[6px]">{mm}:{ss}</div>
        <button onClick={stop} className="bg-green text-black border-0 w-full py-2.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer rounded-sm mt-2">
          ⏹ TERMINAR PARTIDO
        </button>
      </div>
    );
  }

  return (
    <div className="text-center my-3">
      <div className="font-mono text-[36px] text-green tracking-[6px]">{mm}:{ss}</div>
      <div className="flex gap-2 mt-2">
        <button onClick={resume} className="bg-transparent text-muted border border-border-strong flex-1 px-3 py-2 text-[12px] cursor-pointer rounded-sm font-sans">
          ↩ Reanudar partido
        </button>
        <div className="flex-2 flex items-center justify-center text-green text-[12px] font-mono">
          ✓ {mm}:{ss} registrados
        </div>
      </div>
    </div>
  );
}

// ── Contador +/- ──────────────────────────────────────────────────────────────
function ScoreCounter({ value, onChange, color = "text-brand" }) {
  const num = Number(value);
  return (
    <div className="flex items-center gap-2.5 justify-center">
      <button
        className="w-10 h-10 rounded-sm border border-border-strong bg-border-mid text-white text-[22px] cursor-pointer flex items-center justify-center"
        onClick={() => onChange(Math.max(0, num - 1))}
      >−</button>
      <span className={`font-mono text-[34px] min-w-10 text-center font-bold ${color}`}>
        {num}
      </span>
      <button
        className={`w-10 h-10 rounded-sm border bg-border-mid text-[22px] flex items-center justify-center ${color} border-current ${num >= 7 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={() => onChange(Math.min(7, num + 1))}
        disabled={num >= 7}
      >+</button>
    </div>
  );
}

// ── Scores + fecha ────────────────────────────────────────────────────────────
function ScoreSection({ form, setForm, isEditing, onSave, onCancel }) {
  const [timerDone, setTimerDone] = useState(isEditing);

  function handleTimerStop(seconds) {
    if (seconds === null) {
      setForm((f) => ({ ...f, duration_seconds: null }));
      setTimerDone(false);
    } else {
      setForm((f) => ({ ...f, duration_seconds: seconds }));
      setTimerDone(true);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <div className="text-[11px] tracking-[2px] text-brand font-mono font-bold">🟡 P1</div>
        <div className="font-condensed font-black text-[32px] text-border-strong text-center mx-2">VS</div>
        <div className="text-[11px] tracking-[2px] text-cyan font-mono font-bold">🔵 P2</div>
      </div>
      <div className="flex gap-4 justify-center items-center">
        <ScoreCounter value={form.score1} onChange={(v) => setForm((f) => ({ ...f, score1: v }))} color="text-brand" />
        <span className="text-muted font-mono text-[20px]">—</span>
        <ScoreCounter value={form.score2} onChange={(v) => setForm((f) => ({ ...f, score2: v }))} color="text-cyan" />
      </div>

      {!isEditing && <Timer onStop={handleTimerStop} />}

      <div className="mt-3">
        <input type="date"
          className="bg-surface border border-border-mid text-white px-3.5 py-2.5 font-sans text-[13px] rounded-sm outline-none w-auto"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />
      </div>

      {(timerDone || isEditing) && (
        <div className="flex gap-2.5 mt-4">
          <button onClick={onSave} disabled={form.score1 === form.score2} className={`text-base border-0 flex-1 py-2.5 font-condensed font-bold text-[13px] tracking-wide rounded-sm ${form.score1 === form.score2 ? "bg-border-mid text-muted cursor-not-allowed" : "bg-brand cursor-pointer"}`}>
            {isEditing ? "GUARDAR CAMBIOS" : "REGISTRAR PARTIDO"}
          </button>
          <button onClick={onCancel} className="bg-transparent text-muted border border-border-strong px-3 py-2 text-[12px] cursor-pointer rounded-sm font-sans">
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Pairs mode ────────────────────────────────────────────────────────────────
function PairsForm({ form, setForm, tournament, isEditing, onSave, onCancel }) {
  const { pairs, players } = tournament;
  return (
    <div className="bg-surface border border-border-mid rounded-lg p-5 mb-6">
      <div className="font-condensed font-bold text-[14px] tracking-[2px] text-muted mb-4">
        {isEditing ? "EDITAR PARTIDO" : "NUEVO PARTIDO"}
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-35">
          <div className="text-[11px] tracking-[2px] text-brand font-mono mb-2 font-bold">🟡 PAREJA 1</div>
          <select className="w-full bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none mb-2"
            value={form.team1Pair || ""} onChange={(e) => setForm({ ...form, team1Pair: e.target.value })}>
            <option value="">Seleccionar pareja</option>
            {pairs.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === form.team2Pair}>
                {getPairLabel(p.id, pairs, players)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-35">
          <div className="text-[11px] tracking-[2px] text-cyan font-mono mb-2 font-bold">🔵 PAREJA 2</div>
          <select className="w-full bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none mb-2"
            value={form.team2Pair || ""} onChange={(e) => setForm({ ...form, team2Pair: e.target.value })}>
            <option value="">Seleccionar pareja</option>
            {pairs.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === form.team1Pair}>
                {getPairLabel(p.id, pairs, players)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {form.team1Pair && form.team2Pair && (
        <ScoreSection form={form} setForm={setForm} isEditing={isEditing} onSave={onSave} onCancel={onCancel} />
      )}
    </div>
  );
}

// ── Free mode ─────────────────────────────────────────────────────────────────
function FreeForm({ form, setForm, tournament, isEditing, onSave, onCancel }) {
  const { players } = tournament;
  const allSelected = [...form.team1, ...form.team2].filter(Boolean);

  function updateTeam(side, index, value) {
    const updated = [...form[side]];
    updated[index] = value;
    setForm({ ...form, [side]: updated });
  }

  const teamsComplete = form.team1[0] && form.team1[1] && form.team2[0] && form.team2[1];

  return (
    <div className="bg-surface border border-border-mid rounded-lg p-5 mb-6">
      <div className="font-condensed font-bold text-[14px] tracking-[2px] text-muted mb-4">
        {isEditing ? "EDITAR PARTIDO" : "NUEVO PARTIDO"}
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-35">
          <div className="text-[11px] tracking-[2px] text-brand font-mono mb-2 font-bold">🟡 EQUIPO 1</div>
          {[0, 1].map((i) => (
            <select key={i} className="w-full bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none mb-2"
              value={form.team1[i]} onChange={(e) => updateTeam("team1", i, e.target.value)}>
              <option value="">Jugador {i + 1}</option>
              {players.map((p) => (
                <option key={p.id} value={p.id} disabled={allSelected.includes(p.id) && form.team1[i] !== p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ))}
        </div>
        <div className="flex-1 min-w-35">
          <div className="text-[11px] tracking-[2px] text-cyan font-mono mb-2 font-bold">🔵 EQUIPO 2</div>
          {[0, 1].map((i) => (
            <select key={i} className="w-full bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none mb-2"
              value={form.team2[i]} onChange={(e) => updateTeam("team2", i, e.target.value)}>
              <option value="">Jugador {i + 1}</option>
              {players.map((p) => (
                <option key={p.id} value={p.id} disabled={allSelected.includes(p.id) && form.team2[i] !== p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>
      {teamsComplete && (
        <ScoreSection form={form} setForm={setForm} isEditing={isEditing} onSave={onSave} onCancel={onCancel} />
      )}
    </div>
  );
}

export default function MatchForm(props) {
  return props.tournament.mode === "pairs"
    ? <PairsForm {...props} />
    : <FreeForm  {...props} />;
}

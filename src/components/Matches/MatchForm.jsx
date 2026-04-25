import { useState, useEffect, useRef } from "react";
import { getPairLabel } from "../../utils/helpers";
import { CirclePlay, CircleStop, CircleX, Play } from "lucide-react";
import PlayerAvatar, { PairAvatar } from "../shared/PlayerAvatar";

const EMPTY_TIMER = { startedAt: null, stoppedAt: null };

// ── Cronómetro (controlado, basado en timestamps) ──────────────────────────────
function Timer({ timerState = EMPTY_TIMER, onTimerChange, onStop }) {
  const running = timerState.startedAt !== null && timerState.stoppedAt === null;
  const stopped = timerState.startedAt !== null && timerState.stoppedAt !== null;
  const [liveSeconds, setLiveSeconds] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    clearInterval(ref.current);
    if (!running) return;
    // Date.now() solo dentro del callback del interval, nunca en el render
    ref.current = setInterval(() => {
      setLiveSeconds(Math.floor((Date.now() - timerState.startedAt) / 1000));
    }, 500);
    return () => clearInterval(ref.current);
  }, [running, timerState.startedAt]);

  // Cómputo puro (sin Date.now): solo para stopped e idle
  const seconds = stopped
    ? Math.floor((timerState.stoppedAt - timerState.startedAt) / 1000)
    : running ? liveSeconds : 0;

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  function start() {
    onTimerChange({ startedAt: Date.now(), stoppedAt: null });
  }

  function stop() {
    const now = Date.now();
    const secs = Math.floor((now - timerState.startedAt) / 1000);
    onTimerChange({ startedAt: timerState.startedAt, stoppedAt: now });
    onStop(secs);
  }

  function resume() {
    const elapsed = timerState.stoppedAt - timerState.startedAt;
    const newStartedAt = Date.now() - elapsed;
    onTimerChange({ startedAt: newStartedAt, stoppedAt: null });
    onStop(null);
  }

  if (!running && !stopped) {
    return (
      <div onClick={start} className="flex flex-row items-center justify-center gap-2 bg-brand text-base border-0 w-full py-2.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer rounded-sm mt-3">
        <Play size={13} />
        <span>INICIAR CRONÓMETRO</span>
      </div>
    );
  }

  if (running) {
    return (
      
      <div className="flex flex-row items-center gap-2 justify-center text-center my-3">
        <div className="font-mono text-[36px] text-brand tracking-[6px]">{mm}:{ss}</div>
        <CircleStop onClick={stop} size={30} className="bg-brand rounded-4xl items-center text-black cursor-pointer"/>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center gap-2 justify-center text-center my-3">
      <div className="font-mono text-[36px] text-green tracking-[6px]">{mm}:{ss}</div>
      <CirclePlay onClick={resume} size={30} className="bg-green rounded-4xl items-center text-black cursor-pointer"/>
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
function ScoreSection({ form, setForm, isEditing, onSave, onCancel, timerState, onTimerChange, team1Avatar, team2Avatar }) {
  function handleTimerStop(seconds) {
    if (seconds === null) {
      setForm((f) => ({ ...f, duration_seconds: null }));
    } else {
      setForm((f) => ({ ...f, duration_seconds: seconds }));
    }
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">{team1Avatar}</div>
        <div className="font-condensed font-black text-[32px] text-border-strong text-center mx-2">VS</div>
        <div className="flex items-center gap-2">{team2Avatar}</div>
      </div>
      <div className="flex gap-4 justify-center items-center">
        <ScoreCounter value={form.score1} onChange={(v) => setForm((f) => ({ ...f, score1: v }))} color="text-brand" />
        <span className="text-muted font-mono text-[20px]">—</span>
        <ScoreCounter value={form.score2} onChange={(v) => setForm((f) => ({ ...f, score2: v }))} color="text-cyan" />
      </div>

      {!isEditing && (
        <Timer timerState={timerState} onTimerChange={onTimerChange} onStop={handleTimerStop} />
      )}

      <div className="mt-3 flex justify-center">
        <input type="date"
          className="bg-surface border border-border-mid text-white px-3.5 py-2.5 font-sans text-[13px] rounded-sm outline-none w-auto"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />
      </div>

        <div className="flex gap-2.5 mt-4">
          <button onClick={onSave} disabled={form.score1 === form.score2} className={`text-base border-0 flex-1 py-2.5 font-condensed font-bold text-[13px] tracking-wide rounded-sm ${form.score1 === form.score2 ? "bg-border-mid text-muted cursor-not-allowed" : "bg-brand cursor-pointer"}`}>
            {isEditing ? "GUARDAR CAMBIOS" : "REGISTRAR PARTIDO"}
          </button>
          <button onClick={onCancel} className="bg-transparent text-muted border border-border-strong px-3 py-2 text-[12px] cursor-pointer rounded-sm font-sans">
            Cancelar
          </button>
        </div>
    </div>
  );
}

// ── Pairs mode ────────────────────────────────────────────────────────────────
function PairsForm({ form, setForm, tournament, isEditing, onSave, onCancel, timerState, onTimerChange, pairMatchCounts, pairMatchLimit }) {
  const { pairs, players } = tournament;
  const removedIds    = new Set(players.filter((p) => p.removed).map((p) => p.id));
  const selectablePairs = pairs.filter((p) => !removedIds.has(p.p1) && !removedIds.has(p.p2));
  const showCounts = !isEditing && pairMatchCounts && pairMatchLimit;

  function pairOptionLabel(pairId) {
    const base = getPairLabel(pairId, pairs, players);
    if (!showCounts) return base;
    const count = pairMatchCounts[pairId] ?? 0;
    return `${base} · ${count}/${pairMatchLimit} PJ`;
  }

  function isAtLimit(pairId) {
    if (!showCounts) return false;
    return (pairMatchCounts[pairId] ?? 0) >= pairMatchLimit;
  }

  function pairAvatarFor(pairId) {
    const pair = pairs.find((p) => p.id === pairId);
    if (!pair) return null;
    const p1 = players.find((pl) => pl.id === pair.p1);
    const p2 = players.find((pl) => pl.id === pair.p2);
    return (
      <PairAvatar
        name1={p1?.name ?? "?"}
        name2={p2?.name ?? "?"}
        src1={p1?.linked_avatar_url ?? null}
        src2={p2?.linked_avatar_url ?? null}
        size={26}
      />
    );
  }

  return (
    <div className="bg-surface border border-border-mid rounded-lg p-5 mb-6">
      <div className="flex flex-row items-center justify-between font-condensed font-bold text-[14px] tracking-[2px] text-muted mb-4">
        <span>{isEditing ? "EDITAR PARTIDO" : "NUEVO PARTIDO"}</span>
        <CircleX className="text-muted" size={20} onClick={onCancel}/>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-35">
          <div className="text-[11px] tracking-[2px] text-brand font-mono mb-2 font-bold">🟡 PAREJA 1</div>
          <select className="w-full bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none mb-2"
            value={form.team1Pair || ""} onChange={(e) => setForm({ ...form, team1Pair: e.target.value })}>
            <option value="">Seleccionar pareja</option>
            {selectablePairs.map((p) => (
              <option
                key={p.id}
                value={p.id}
                disabled={p.id === form.team2Pair || (isAtLimit(p.id) && p.id !== form.team1Pair)}
              >
                {pairOptionLabel(p.id)}
              </option>
            ))}
          </select>
          {/* {form.team1Pair && (
            <div className="flex items-center gap-2 mt-1">{pairAvatarFor(form.team1Pair)}</div>
          )} */}
        </div>
        <div className="flex-1 min-w-35">
          <div className="text-[11px] tracking-[2px] text-cyan font-mono mb-2 font-bold">🔵 PAREJA 2</div>
          <select className="w-full bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none mb-2"
            value={form.team2Pair || ""} onChange={(e) => setForm({ ...form, team2Pair: e.target.value })}>
            <option value="">Seleccionar pareja</option>
            {selectablePairs.map((p) => (
              <option
                key={p.id}
                value={p.id}
                disabled={p.id === form.team1Pair || (isAtLimit(p.id) && p.id !== form.team2Pair)}
              >
                {pairOptionLabel(p.id)}
              </option>
            ))}
          </select>
          {/* {form.team2Pair && (
            <div className="flex items-center gap-2 mt-1">{pairAvatarFor(form.team2Pair)}</div>
          )} */}
        </div>
      </div>
      {form.team1Pair && form.team2Pair && (
        <ScoreSection
          form={form} setForm={setForm} isEditing={isEditing} onSave={onSave} onCancel={onCancel}
          timerState={timerState} onTimerChange={onTimerChange}
          team1Avatar={pairAvatarFor(form.team1Pair)}
          team2Avatar={pairAvatarFor(form.team2Pair)}
        />
      )}
    </div>
  );
}

// ── Free mode ─────────────────────────────────────────────────────────────────
function FreeForm({ form, setForm, tournament, isEditing, onSave, onCancel, timerState, onTimerChange }) {
  const { players } = tournament;
  const selectablePlayers = players.filter((p) => !p.removed);
  const allSelected = [...form.team1, ...form.team2].filter(Boolean);

  function updateTeam(side, index, value) {
    const updated = [...form[side]];
    updated[index] = value;
    setForm({ ...form, [side]: updated });
  }

  const teamsComplete = form.team1[0] && form.team1[1] && form.team2[0] && form.team2[1];

  function teamAvatars(ids) {
    const p1 = players.find((p) => p.id === ids[0]);
    const p2 = players.find((p) => p.id === ids[1]);
    return (
      <PairAvatar
        name1={p1?.name ?? "?"}
        name2={p2?.name ?? "?"}
        src1={p1?.linked_avatar_url ?? null}
        src2={p2?.linked_avatar_url ?? null}
        size={26}
      />
    );
  }

  return (
    <div className="bg-surface border border-border-mid rounded-lg p-5 mb-6">
      <div className="font-condensed font-bold text-[14px] tracking-[2px] text-muted mb-4">
        {isEditing ? "EDITAR PARTIDO" : "NUEVO PARTIDO"}
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-35">
          <div className="text-[11px] tracking-[2px] text-brand font-mono mb-2 font-bold">🟡 EQUIPO 1</div>
          {[0, 1].map((i) => {
            const selected = selectablePlayers.find((p) => p.id === form.team1[i]);
            return (
              <div key={i} className="flex items-center gap-2 mb-2">
                {selected && (
                  <PlayerAvatar name={selected.name} src={selected.linked_avatar_url ?? null} size={28} />
                )}
                <select className="flex-1 w-full bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none"
                  value={form.team1[i]} onChange={(e) => updateTeam("team1", i, e.target.value)}>
                  <option value="">Jugador {i + 1}</option>
                  {selectablePlayers.map((p) => (
                    <option key={p.id} value={p.id} disabled={allSelected.includes(p.id) && form.team1[i] !== p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
        <div className="flex-1 min-w-35">
          <div className="text-[11px] tracking-[2px] text-cyan font-mono mb-2 font-bold">🔵 EQUIPO 2</div>
          {[0, 1].map((i) => {
            const selected = selectablePlayers.find((p) => p.id === form.team2[i]);
            return (
              <div key={i} className="flex items-center gap-2 mb-2">
                {selected && (
                  <PlayerAvatar name={selected.name} src={selected.linked_avatar_url ?? null} size={28} />
                )}
                <select className="flex-1 w-full bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none"
                  value={form.team2[i]} onChange={(e) => updateTeam("team2", i, e.target.value)}>
                  <option value="">Jugador {i + 1}</option>
                  {selectablePlayers.map((p) => (
                    <option key={p.id} value={p.id} disabled={allSelected.includes(p.id) && form.team2[i] !== p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
      {teamsComplete && (
        <ScoreSection
          form={form} setForm={setForm} isEditing={isEditing} onSave={onSave} onCancel={onCancel}
          timerState={timerState} onTimerChange={onTimerChange}
          team1Avatar={teamAvatars(form.team1)}
          team2Avatar={teamAvatars(form.team2)}
        />
      )}
    </div>
  );
}

export default function MatchForm(props) {
  return props.tournament.mode === "pairs"
    ? <PairsForm {...props} />
    : <FreeForm  {...props} />;
}

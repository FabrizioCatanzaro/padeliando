import { useState, useEffect, useRef } from "react";
import S from "../../styles/theme";
import { getPairLabel } from "../../utils/helpers";

export const emptyForm = () => ({
  team1: ["", ""],
  team2: ["", ""],
  score1: 0,
  score2: 0,
  date: new Date().toISOString().slice(0, 10),
  duration_seconds: null,
});

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
    // No resetea los segundos — sigue desde donde estaba
    setRunning(true);
    setStopped(false);
    ref.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    onStop(null); // limpia el valor guardado hasta que vuelva a parar
  }

  useEffect(() => () => clearInterval(ref.current), []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  if (!running && !stopped) {
    return (
      <button onClick={start} style={{ ...S.primaryBtn, width: "100%", marginTop: 12 }}>
        ▶ INICIAR PARTIDO
      </button>
    );
  }

    if (running) {
      return (
        <div style={{ textAlign: "center", margin: "12px 0" }}>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 36, color: "#e8f04a", letterSpacing: 6 }}>
            {mm}:{ss}
          </div>
          <button onClick={stop} style={{ ...S.primaryBtn, background: "#4af07a", color: "#000", width: "100%", marginTop: 8, fontWeight: 700 }}>
            ⏹ TERMINAR PARTIDO
          </button>
        </div>
      );
    }

    // Detenido — mostrar tiempo + opción de reanudar
  return (
    <div style={{ textAlign: "center", margin: "12px 0" }}>
      <div style={{ fontFamily: "'Courier New', monospace", fontSize: 36, color: "#4af07a", letterSpacing: 6 }}>
        {mm}:{ss}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={resume} style={{ ...S.resetBtn, flex: 1, fontSize: 12 }}>
          ↩ Reanudar partido
        </button>
        <div style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#4af07a", fontSize: 12, fontFamily: "'Courier New', monospace" }}>
          ✓ {mm}:{ss} registrados
        </div>
      </div>
    </div>
  );
}

// ── Contador +/- ──────────────────────────────────────────────────────────────
function ScoreCounter({ value, onChange, color = "#e8f04a" }) {
  const btn = {
    width: 40, height: 40, borderRadius: 4, border: "1px solid #2a3040",
    background: "#1a2030", color: "#fff", fontSize: 22, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
      <button style={btn} onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <span style={{
        fontFamily: "'Courier New', monospace", fontSize: 34,
        color, minWidth: 40, textAlign: "center", fontWeight: 700,
      }}>
        {value}
      </span>
      <button style={{ ...btn, borderColor: color, color }} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

// ── Scores + fecha ────────────────────────────────────────────────────────────
function ScoreSection({ form, setForm, isEditing, onSave, onCancel }) {
  const [timerDone, setTimerDone] = useState(isEditing); // en edición no mostramos timer

  function handleTimerStop(seconds) {
    if (seconds === null) {
      setForm((f) => ({ ...f, duration_seconds: null }));
      setTimerDone(false);  // oculta el botón de guardar mientras corre de nuevo
    } else {
      setForm((f) => ({ ...f, duration_seconds: seconds }));
      setTimerDone(true);
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={S.teamLabel}>🟡 E1</div>
        <div style={{ ...S.vsLabel, margin: "0 8px" }}>VS</div>
        <div style={{ ...S.teamLabel, color: "#4af0c8" }}>🔵 E2</div>
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", alignItems: "center" }}>
        <ScoreCounter value={form.score1} onChange={(v) => setForm((f) => ({ ...f, score1: v }))} color="#e8f04a" />
        <span style={{ color: "#555", fontFamily: "'Courier New', monospace", fontSize: 20 }}>—</span>
        <ScoreCounter value={form.score2} onChange={(v) => setForm((f) => ({ ...f, score2: v }))} color="#4af0c8" />
      </div>

      {!isEditing && (
        <Timer onStop={handleTimerStop} />
      )}

      <div style={{ marginTop: 12 }}>
        <input type="date"
          style={{ ...S.input, width: "auto", fontSize: 13, marginBottom: 0 }}
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />
      </div>

      {(timerDone || isEditing) && (
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onSave} style={{ ...S.primaryBtn, flex: 1 }}>
            {isEditing ? "GUARDAR CAMBIOS" : "REGISTRAR PARTIDO"}
          </button>
          <button onClick={onCancel} style={S.resetBtn}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

// ── Pairs mode ────────────────────────────────────────────────────────────────
function PairsForm({ form, setForm, tournament, isEditing, onSave, onCancel }) {
  const { pairs, players } = tournament;
  return (
    <div style={S.form}>
      <div style={S.formTitle}>{isEditing ? "EDITAR PARTIDO" : "NUEVO PARTIDO"}</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={S.teamLabel}>🟡 PAREJA 1</div>
          <select style={S.select} value={form.team1Pair || ""}
            onChange={(e) => setForm({ ...form, team1Pair: e.target.value })}>
            <option value="">Seleccionar pareja</option>
            {pairs.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === form.team2Pair}>
                {getPairLabel(p.id, pairs, players)}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ ...S.teamLabel, color: "#4af0c8" }}>🔵 PAREJA 2</div>
          <select style={S.select} value={form.team2Pair || ""}
            onChange={(e) => setForm({ ...form, team2Pair: e.target.value })}>
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
    <div style={S.form}>
      <div style={S.formTitle}>{isEditing ? "EDITAR PARTIDO" : "NUEVO PARTIDO"}</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={S.teamLabel}>🟡 EQUIPO 1</div>
          {[0, 1].map((i) => (
            <select key={i} style={S.select} value={form.team1[i]}
              onChange={(e) => updateTeam("team1", i, e.target.value)}>
              <option value="">Jugador {i + 1}</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}
                  disabled={allSelected.includes(p.id) && form.team1[i] !== p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ ...S.teamLabel, color: "#4af0c8" }}>🔵 EQUIPO 2</div>
          {[0, 1].map((i) => (
            <select key={i} style={S.select} value={form.team2[i]}
              onChange={(e) => updateTeam("team2", i, e.target.value)}>
              <option value="">Jugador {i + 1}</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}
                  disabled={allSelected.includes(p.id) && form.team2[i] !== p.id}>
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
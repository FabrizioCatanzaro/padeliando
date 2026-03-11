import S from "../../styles/theme";
import { getPairLabel } from "../../utils/helpers";

const emptyForm = () => ({
  team1: ["", ""],
  team2: ["", ""],
  score1: "",
  score2: "",
  date: new Date().toISOString().slice(0, 10),
});

export { emptyForm };

// ── Pairs mode form ────────────────────────────────────────────────────────────
function PairsForm({ form, setForm, tournament, isEditing, onSave, onCancel }) {
  const { pairs, players } = tournament;
  const usedTeam1 = form.team1Pair || "";
  const usedTeam2 = form.team2Pair || "";

  return (
    <div style={S.form}>
      <div style={S.formTitle}>{isEditing ? "EDITAR PARTIDO" : "NUEVO PARTIDO"}</div>
      <div style={S.formGrid}>
        {/* Team 1 */}
        <div>
          <div style={S.teamLabel}>🟡 PAREJA 1</div>
          <select
            style={S.select}
            value={usedTeam1}
            onChange={(e) => setForm({ ...form, team1Pair: e.target.value })}
          >
            <option value="">Seleccionar pareja</option>
            {pairs.map((pair) => (
              <option key={pair.id} value={pair.id} disabled={pair.id === usedTeam2}>
                {getPairLabel(pair.id, pairs, players)}
              </option>
            ))}
          </select>
        </div>

        {/* Score & date */}
        <div style={{ textAlign: "center" }}>
          <div style={S.vsLabel}>VS</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", marginTop: 12 }}>
            <input type="number" min="0" style={S.scoreInput} placeholder="0"
              value={form.score1} onChange={(e) => setForm({ ...form, score1: e.target.value })} />
            <span style={{ color: "#666", fontFamily: "'Courier New', monospace" }}>—</span>
            <input type="number" min="0" style={S.scoreInput} placeholder="0"
              value={form.score2} onChange={(e) => setForm({ ...form, score2: e.target.value })} />
          </div>
          <div style={{ marginTop: 12 }}>
            <input type="date" style={{ ...S.input, width: "auto", fontSize: 13, marginBottom: 0 }}
              value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
        </div>

        {/* Team 2 */}
        <div>
          <div style={{ ...S.teamLabel, color: "#4af0c8" }}>🔵 PAREJA 2</div>
          <select
            style={S.select}
            value={usedTeam2}
            onChange={(e) => setForm({ ...form, team2Pair: e.target.value })}
          >
            <option value="">Seleccionar pareja</option>
            {pairs.map((pair) => (
              <option key={pair.id} value={pair.id} disabled={pair.id === usedTeam1}>
                {getPairLabel(pair.id, pairs, players)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Actions onSave={onSave} onCancel={onCancel} isEditing={isEditing} />
    </div>
  );
}

// ── Free mode form ─────────────────────────────────────────────────────────────
function FreeForm({ form, setForm, tournament, isEditing, onSave, onCancel }) {
  const { players } = tournament;
  const allSelected = [...form.team1, ...form.team2].filter(Boolean);

  function updateTeam(side, index, value) {
    const updated = [...form[side]];
    updated[index] = value;
    setForm({ ...form, [side]: updated });
  }

  return (
    <div style={S.form}>
      <div style={S.formTitle}>{isEditing ? "EDITAR PARTIDO" : "NUEVO PARTIDO"}</div>
      <div style={S.formGrid}>
        {/* Team 1 */}
        <div>
          <div style={S.teamLabel}>🟡 EQUIPO 1</div>
          {[0, 1].map((i) => (
            <select key={i} style={S.select} value={form.team1[i]}
              onChange={(e) => updateTeam("team1", i, e.target.value)}>
              <option value="">Jugador {i + 1}</option>
              {players.map((p) => {
                const takenElsewhere = allSelected.includes(p.id) && form.team1[i] !== p.id;
                return (
                  <option key={p.id} value={p.id} disabled={takenElsewhere}
                    style={takenElsewhere ? { textDecoration: "line-through", color: "#555" } : {}}>
                    {p.name}{takenElsewhere ? " ✗" : ""}
                  </option>
                );
              })}
            </select>
          ))}
        </div>

        {/* Score & date */}
        <div style={{ textAlign: "center" }}>
          <div style={S.vsLabel}>VS</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", marginTop: 12 }}>
            <input type="number" min="0" style={S.scoreInput} placeholder="0"
              value={form.score1} onChange={(e) => setForm({ ...form, score1: e.target.value })} />
            <span style={{ color: "#666", fontFamily: "'Courier New', monospace" }}>—</span>
            <input type="number" min="0" style={S.scoreInput} placeholder="0"
              value={form.score2} onChange={(e) => setForm({ ...form, score2: e.target.value })} />
          </div>
          <div style={{ marginTop: 12 }}>
            <input type="date" style={{ ...S.input, width: "auto", fontSize: 13, marginBottom: 0 }}
              value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
        </div>

        {/* Team 2 */}
        <div>
          <div style={{ ...S.teamLabel, color: "#4af0c8" }}>🔵 EQUIPO 2</div>
          {[0, 1].map((i) => (
            <select key={i} style={S.select} value={form.team2[i]}
              onChange={(e) => updateTeam("team2", i, e.target.value)}>
              <option value="">Jugador {i + 1}</option>
              {players.map((p) => {
                const takenElsewhere = allSelected.includes(p.id) && form.team2[i] !== p.id;
                return (
                  <option key={p.id} value={p.id} disabled={takenElsewhere}
                    style={takenElsewhere ? { color: "#555" } : {}}>
                    {p.name}{takenElsewhere ? " ✗" : ""}
                  </option>
                );
              })}
            </select>
          ))}
        </div>
      </div>
      <Actions onSave={onSave} onCancel={onCancel} isEditing={isEditing} />
    </div>
  );
}

function Actions({ onSave, onCancel, isEditing }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
      <button onClick={onSave} style={{ ...S.primaryBtn, flex: 1 }}>
        {isEditing ? "GUARDAR CAMBIOS" : "REGISTRAR PARTIDO"}
      </button>
      <button onClick={onCancel} style={S.resetBtn}>Cancelar</button>
    </div>
  );
}

export default function MatchForm(props) {
  return props.tournament.mode === "pairs"
    ? <PairsForm {...props} />
    : <FreeForm  {...props} />;
}
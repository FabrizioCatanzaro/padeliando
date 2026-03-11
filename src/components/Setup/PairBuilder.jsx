import S from "../../styles/theme";
import { uid } from "../../utils/helpers";

/**
 * Shown when player count is even.
 * User assigns all players into N/2 fixed pairs via two dropdowns per row.
 * pairs: [{ id, p1Name, p2Name }]
 */
export default function PairBuilder({ players, pairs, onChange }) {
  const assignedIds = pairs.flatMap((p) => [p.p1Name, p.p2Name]).filter(Boolean);
  const allAssigned = assignedIds.length === players.length && pairs.every((p) => p.p1Name && p.p2Name);

  function updatePair(id, field, value) {
    onChange(pairs.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function addPair() {
    onChange([...pairs, { id: uid(), p1Name: "", p2Name: "" }]);
  }

  function removePair(id) {
    onChange(pairs.filter((p) => p.id !== id));
  }

  // Which names are already chosen elsewhere (for a given pair row)
  function takenBy(currentPairId) {
    return pairs
      .filter((p) => p.id !== currentPairId)
      .flatMap((p) => [p.p1Name, p.p2Name])
      .filter(Boolean);
  }

  return (
    <div style={{ marginTop: 24 }}>
      <label style={S.label}>ARMÁ LAS PAREJAS</label>
      <p style={{ color: "#555", fontSize: 12, fontFamily: "'Barlow', sans-serif", marginTop: 0, marginBottom: 12 }}>
        Todos los jugadores deben quedar asignados a una pareja.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pairs.map((pair) => {
          const taken = takenBy(pair.id);
          return (
            <div key={pair.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                style={{ ...S.select, flex: 1, marginBottom: 0 }}
                value={pair.p1Name}
                onChange={(e) => updatePair(pair.id, "p1Name", e.target.value)}
              >
                <option value="">Jugador 1</option>
                {players.map((p) => (
                  <option
                    key={p}
                    value={p}
                    disabled={taken.includes(p) || p === pair.p2Name}
                  >
                    {p}{taken.includes(p) && p !== pair.p1Name ? " (asignado)" : ""}
                  </option>
                ))}
              </select>

              <span style={{ color: "#555", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                &amp;
              </span>

              <select
                style={{ ...S.select, flex: 1, marginBottom: 0 }}
                value={pair.p2Name}
                onChange={(e) => updatePair(pair.id, "p2Name", e.target.value)}
              >
                <option value="">Jugador 2</option>
                {players.map((p) => (
                  <option
                    key={p}
                    value={p}
                    disabled={taken.includes(p) || p === pair.p1Name}
                  >
                    {p}{taken.includes(p) && p !== pair.p2Name ? " (asignado)" : ""}
                  </option>
                ))}
              </select>

              <button
                onClick={() => removePair(pair.id)}
                style={{ ...S.removeBtn, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {pairs.length < players.length / 2 && (
        <button onClick={addPair} style={{ ...S.addBtn, marginTop: 8 }}>
          + Agregar pareja
        </button>
      )}

      {!allAssigned && pairs.length > 0 && (
        <p style={{ color: "#f04a4a", fontSize: 11, fontFamily: "'Courier New', monospace", marginTop: 8 }}>
          Todos los jugadores deben estar en una pareja para continuar.
        </p>
      )}
    </div>
  );
}
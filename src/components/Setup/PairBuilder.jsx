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

  function takenBy(currentPairId) {
    return pairs
      .filter((p) => p.id !== currentPairId)
      .flatMap((p) => [p.p1Name, p.p2Name])
      .filter(Boolean);
  }

  return (
    <div className="mt-6">
      <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-2 mt-5">ARMÁ LAS PAREJAS</label>
      <p className="text-muted font-sans text-[12px] mt-0 mb-3">
        Todos los jugadores deben quedar asignados a una pareja.
      </p>

      <div className="flex flex-col gap-2">
        {pairs.map((pair) => {
          const taken = takenBy(pair.id);
          return (
            <div key={pair.id} className="flex gap-2 items-center">
              <select
                className="flex-1 bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none"
                value={pair.p1Name}
                onChange={(e) => updatePair(pair.id, "p1Name", e.target.value)}
              >
                <option value="">Jugador 1</option>
                {players.map((p) => (
                  <option key={p} value={p} disabled={taken.includes(p) || p === pair.p2Name}>
                    {p}{taken.includes(p) && p !== pair.p1Name ? " (asignado)" : ""}
                  </option>
                ))}
              </select>

              <span className="text-muted font-condensed font-bold">&amp;</span>

              <select
                className="flex-1 bg-base border border-border-mid text-content px-3 py-2.25 font-sans text-[13px] rounded-sm outline-none"
                value={pair.p2Name}
                onChange={(e) => updatePair(pair.id, "p2Name", e.target.value)}
              >
                <option value="">Jugador 2</option>
                {players.map((p) => (
                  <option key={p} value={p} disabled={taken.includes(p) || p === pair.p1Name}>
                    {p}{taken.includes(p) && p !== pair.p2Name ? " (asignado)" : ""}
                  </option>
                ))}
              </select>

              <button onClick={() => removePair(pair.id)} className="bg-surface border-0 text-muted px-3 py-2.5 cursor-pointer rounded-sm text-[12px] shrink-0">✕</button>
            </div>
          );
        })}
      </div>

      {pairs.length < players.length / 2 && (
        <button onClick={addPair} className="bg-transparent border border-dashed border-border-strong text-muted px-4 py-2 cursor-pointer font-condensed tracking-wide text-[13px] rounded-sm w-full mt-2">
          + Agregar pareja
        </button>
      )}

      {!allAssigned && pairs.length > 0 && (
        <p className="text-danger text-[11px] font-mono mt-2">
          Todos los jugadores deben estar en una pareja para continuar.
        </p>
      )}
    </div>
  );
}

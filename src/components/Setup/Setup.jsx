import { useState } from "react";
import S, { FONTS } from "../../styles/theme";
import { uid } from "../../utils/helpers";
import PlayerInput from "./PlayerInput";
import PairBuilder from "./PairBuilder";

export default function Setup({ onCreate }) {
  const [name, setName]         = useState("");
  const [playerNames, setPlayerNames] = useState(["", "", "", ""]);
  const [pairs, setPairs]       = useState([]);
  const [step, setStep]         = useState("players"); // "players" | "pairs"

  const filledNames = playerNames.filter((n) => n.trim());
  const isEven = filledNames.length > 0 && filledNames.length % 2 === 0;
  const hasDupes = new Set(filledNames.map((n) => n.trim().toLowerCase())).size !== filledNames.length;

  const playersValid =
    name.trim() &&
    filledNames.length >= 4 &&
    !hasDupes;

  const allPairsFilled =
    pairs.length === filledNames.length / 2 &&
    pairs.every((p) => p.p1Name && p.p2Name);

  function addPlayer()         { setPlayerNames([...playerNames, ""]); }
  function removePlayer(i)     { setPlayerNames(playerNames.filter((_, idx) => idx !== i)); }
  function updatePlayer(i, v)  { const p = [...playerNames]; p[i] = v; setPlayerNames(p); }

  function handleNext() {
    if (!playersValid) return;
    if (isEven) {
      // Pre-populate pair rows
      setPairs(Array.from({ length: filledNames.length / 2 }, () => ({ id: uid(), p1Name: "", p2Name: "" })));
      setStep("pairs");
    } else {
      onCreate(name.trim(), filledNames, null);
    }
  }

  function handleCreate() {
    if (!allPairsFilled) return;
    onCreate(name.trim(), filledNames, pairs);
  }

  return (
    <div style={S.page}>
      <style>{FONTS}</style>
      <div style={S.setupCard}>
        <div style={S.logo}>🎾 PADEL<span style={{ color: "#e8f04a" }}>EANDO</span></div>
        <p style={S.subtitle}>Creá tu torneo y empezá a jugar</p>

        {step === "players" && (
          <>
            <label style={S.label}>NOMBRE DEL TORNEO</label>
            <input
              style={S.input}
              placeholder="ej: Liga Verano 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label style={S.label}>JUGADORES <span style={{ color: "#555" }}>(mínimo 4)</span></label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {playerNames.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <PlayerInput
                    value={p}
                    onChange={(v) => updatePlayer(i, v)}
                    placeholder={`Jugador ${i + 1}`}
                  />
                  {playerNames.length > 4 && (
                    <button onClick={() => removePlayer(i)} style={S.removeBtn}>✕</button>
                  )}
                </div>
              ))}
            </div>

            {hasDupes && (
              <p style={{ color: "#f04a4a", fontSize: 11, fontFamily: "'Courier New', monospace", marginTop: 8 }}>
                Hay nombres duplicados.
              </p>
            )}

            <button onClick={addPlayer} style={S.addBtn}>+ Agregar jugador</button>

            {filledNames.length >= 4 && (
              <div style={{ ...S.infoBanner, marginTop: 16 }}>
                {isEven
                  ? `✦ ${filledNames.length} jugadores — en el siguiente paso armás las ${filledNames.length / 2} parejas fijas.`
                  : `✦ ${filledNames.length} jugadores — número impar, los equipos se armarán partido a partido.`}
              </div>
            )}

            <button
              onClick={handleNext}
              style={{ ...S.createBtn, opacity: playersValid ? 1 : 0.4, cursor: playersValid ? "pointer" : "not-allowed" }}
            >
              {isEven ? "SIGUIENTE → PAREJAS" : "CREAR TORNEO"}
            </button>
          </>
        )}

        {step === "pairs" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <button onClick={() => setStep("players")} style={{ ...S.resetBtn, fontSize: 13 }}>← Volver</button>
              <span style={{ color: "#555", fontSize: 12, fontFamily: "'Courier New', monospace" }}>
                {name} · {filledNames.length} jugadores
              </span>
            </div>

            <PairBuilder players={filledNames} pairs={pairs} onChange={setPairs} />

            <button
              onClick={handleCreate}
              style={{ ...S.createBtn, marginTop: 24, opacity: allPairsFilled ? 1 : 0.4, cursor: allPairsFilled ? "pointer" : "not-allowed" }}
            >
              CREAR TORNEO
            </button>
          </>
        )}
      </div>
    </div>
  );
}
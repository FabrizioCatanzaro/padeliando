import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { uid } from "../../utils/helpers";
import { useTournament } from "../../hooks/useTournament";
import PlayerInput from "./PlayerInput";
import PairBuilder from "./PairBuilder";
import { ChevronLeft } from "lucide-react";

export default function Setup() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { handleCreate: createTournament } = useTournament(groupId, null);
  const [format, setFormat]       = useState("liga");
  const [name, setName]           = useState("");
  const [playerNames, setPlayerNames] = useState(["", "", "", ""]);
  const [pairs, setPairs]         = useState([]);
  const [step, setStep]           = useState("formato");
  const [error, setError]         = useState(false);

  const [directPairs, setDirectPairs] = useState(() =>
    Array.from({ length: 8 }, () => ({ id: uid(), p1Name: "", p2Name: "" }))
  );

  const filledNames = playerNames.filter((n) => n.trim());

  const isEven   = filledNames.length > 0 && filledNames.length % 2 === 0;
  const hasDupes = new Set(filledNames.map((n) => n.trim().toLowerCase())).size !== filledNames.length;

  const minPlayers  = 4;
  const playersValid = name.trim()
    && filledNames.length >= minPlayers
    && !hasDupes;
  const tituloValido = name?.length <= 30 && name?.length >= 2;

  const allPairsFilled =
    pairs.length === filledNames.length / 2 &&
    pairs.every((p) => p.p1Name && p.p2Name);

  // Validación para el paso direct-pairs (americano)
  const directPairNames = directPairs.flatMap(p => [p.p1Name.trim(), p.p2Name.trim()]).filter(Boolean);
  const directHasDupes  = new Set(directPairNames.map(n => n.toLowerCase())).size !== directPairNames.length;
  const directAllFilled = directPairs.every(p => p.p1Name.trim() && p.p2Name.trim());
  const directPairsValid = tituloValido && directAllFilled && !directHasDupes;

  function addPlayer()         { setPlayerNames([...playerNames, ""]); }
  function removePlayer(i)     { setPlayerNames(playerNames.filter((_, idx) => idx !== i)); }
  function updatePlayer(i, v)  { const p = [...playerNames]; p[i] = v; setPlayerNames(p); }

  function updateDirectPair(id, field, value) {
    setDirectPairs(directPairs.map(p => p.id === id ? { ...p, [field]: value } : p));
  }
  function addDirectPair() {
    if (directPairs.length < 16) setDirectPairs([...directPairs, { id: uid(), p1Name: "", p2Name: "" }]);
  }
  function removeDirectPair(id) {
    if (directPairs.length > 8) setDirectPairs(directPairs.filter(p => p.id !== id));
  }

  async function onCreate(tournamentName, players, pairsInput, fmt) {
    const tId = await createTournament(tournamentName, players, pairsInput, fmt);
    navigate(`/cat/${groupId}/torneo/${tId}`);
  }

  function handleNext() {
    if (!playersValid) return;
    if (isEven) {
      setPairs(Array.from({ length: filledNames.length / 2 }, () => ({ id: uid(), p1Name: "", p2Name: "" })));
      setStep("pairs");
    } else {
      onCreate(name.trim(), filledNames, null, 'liga');
    }
  }

  function handleCreate() {
    if (!allPairsFilled) return;
    onCreate(name.trim(), filledNames, pairs, 'liga');
  }

  function handleCreateDirect() {
    if (!directPairsValid) return;
    const players = directPairs.flatMap(p => [p.p1Name.trim(), p.p2Name.trim()]);
    const cleanPairs = directPairs.map(p => ({ ...p, p1Name: p.p1Name.trim(), p2Name: p.p2Name.trim() }));
    onCreate(name.trim(), players, cleanPairs, 'americano');
  }

  function infoBox() {
    if (filledNames.length < 4) return null;
    return isEven
      ? `✦ ${filledNames.length} jugadores — en el siguiente paso armás las ${filledNames.length / 2} parejas fijas.`
      : `✦ ${filledNames.length} jugadores — número impar, los equipos se armarán partido a partido.`;
  }

  return (
    <div className="bg-base text-content font-sans pb-15">
      <div className="max-w-125 mx-auto px-7 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div onClick={() => navigate(`/cat/${groupId}`)} className="flex flex-row gap-2 items-center w-fit bg-transparent text-muted border border-border-strong px-3 py-2 text-[13px] cursor-pointer rounded-sm font-sans">
            <ChevronLeft size={15} />
            <span>Volver</span>
          </div>
        </div>
        <p className="text-muted font-sans text-[14px] m-0">Creá tu torneo y empezá a crear los partidos</p>

        {/* ── STEP: formato ── */}
        {step === "formato" && (
          <>
            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-4 mt-5">FORMATO DEL TORNEO</label>
            <div className="flex flex-col gap-3">
              <div
                onClick={() => setFormat('liga')}
                className={`bg-surface border rounded-lg p-4 cursor-pointer transition-all ${format === 'liga' ? 'border-brand' : 'border-border-mid hover:border-border-strong'}`}
              >
                <div className="font-condensed font-bold text-[16px] text-white mb-1">LIGA</div>
                <div className="text-[12px] text-muted font-sans">Partidos libres o por parejas fijas. Tabla de posiciones acumulada.</div>
              </div>
              <div
                onClick={() => setFormat('americano')}
                className={`bg-surface border rounded-lg p-4 cursor-pointer transition-all ${format === 'americano' ? 'border-brand' : 'border-border-mid hover:border-border-strong'}`}
              >
                <div className="font-condensed font-bold text-[16px] text-white mb-1">AMERICANO</div>
                <div className="text-[12px] text-muted font-sans">Fase previa (2 partidos por pareja) + cuadro de eliminación directa. Requiere 8–16 parejas (16–32 jugadores).</div>
              </div>
            </div>
            <button
              onClick={() => setStep(format === 'americano' ? 'direct-pairs' : 'players')}
              className="w-full bg-brand text-base border-0 py-3.5 font-condensed font-black text-[16px] tracking-[2px] rounded-sm mt-7 cursor-pointer"
            >
              {format === 'americano' ? 'SIGUIENTE → PAREJAS' : 'SIGUIENTE → JUGADORES'}
            </button>
          </>
        )}

        {/* ── STEP: players (liga) ── */}
        {step === "players" && (
          <>
            <div className="flex items-center gap-2.5 mb-4">
              <button onClick={() => setStep("formato")} className="bg-transparent text-muted border border-border-strong px-3 py-2 text-[13px] cursor-pointer rounded-sm font-sans">← Volver</button>
              <span className="text-muted text-[12px] font-mono">LIGA</span>
            </div>

            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-2">NOMBRE DEL TORNEO</label>
            <input
              className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 font-sans text-[14px] rounded-sm outline-none mb-2"
              placeholder="ej: Fecha 1 - 24/03"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              minLength={2}
            />

            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-1 mt-5">
              JUGADORES <span className="text-muted">(mínimo 4)</span>
            </label>
            <p className="text-[11px] text-dim font-mono mb-2">Escribí un nombre o <span className="text-brand">@usuario</span> para invitar a alguien registrado.</p>
            <div className="flex flex-col gap-2">
              {playerNames.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <PlayerInput value={p} onChange={(v) => updatePlayer(i, v)} placeholder={`Jugador ${i + 1}`} searchMine />
                  {playerNames.length > 4 && (
                    <button onClick={() => removePlayer(i)} className="bg-surface border-0 text-muted px-3 py-2.5 cursor-pointer rounded-sm text-[12px] shrink-0">✕</button>
                  )}
                </div>
              ))}
            </div>

            {hasDupes && (
              <p className="text-danger text-[11px] font-mono mt-2">Hay nombres duplicados.</p>
            )}

            <button onClick={addPlayer} className="bg-transparent border border-dashed border-border-strong text-muted px-4 py-2 cursor-pointer font-condensed tracking-wide text-[13px] rounded-sm w-full mt-2">
              + Agregar jugador
            </button>

            {infoBox() && (
              <div className="bg-surface-alt border border-border-strong rounded-md px-3.5 py-2.5 text-[12px] text-soft font-mono leading-relaxed mt-4">
                {infoBox()}
              </div>
            )}

            {error && <p className="text-danger text-xs font-mono mt-2">El nombre del torneo debe tener entre 2 y 30 caracteres</p>}
            <button
              onClick={() => tituloValido ? handleNext() : setError(true)}
              className={`w-full bg-brand text-base border-0 py-3.5 font-condensed font-black text-[16px] tracking-[2px] rounded-sm mt-7 transition-opacity cursor-pointer ${playersValid ? 'opacity-100' : 'opacity-40 cursor-not-allowed'}`}
            >
              {isEven ? "SIGUIENTE → PAREJAS" : "CREAR TORNEO"}
            </button>
          </>
        )}

        {/* ── STEP: direct-pairs (americano) ── */}
        {step === "direct-pairs" && (
          <>
            <div className="flex items-center gap-2.5 mb-4">
              <button onClick={() => setStep("formato")} className="bg-transparent text-muted border border-border-strong px-3 py-2 text-[13px] cursor-pointer rounded-sm font-sans">← Volver</button>
              <span className="text-muted text-[12px] font-mono">AMERICANO</span>
            </div>

            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-2">NOMBRE DEL TORNEO</label>
            <input
              className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 font-sans text-[14px] rounded-sm outline-none mb-2"
              placeholder="ej: Fecha 1 - 24/03"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              minLength={2}
            />

            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-1 mt-5">
              PAREJAS <span className="text-muted">(mínimo 8, máximo 16)</span>
            </label>
            <p className="text-[11px] text-dim font-mono mb-2">Escribí un nombre o <span className="text-brand">@usuario</span> para invitar a alguien registrado.</p>

            <div className="flex flex-col gap-2">
              {directPairs.map((pair, i) => (
                <div key={pair.id} className="flex gap-2 items-center">
                  <span className="text-muted text-[11px] font-mono w-5 shrink-0 text-right">{i + 1}</span>
                  <PlayerInput value={pair.p1Name} onChange={(v) => updateDirectPair(pair.id, 'p1Name', v)} placeholder="Jugador 1" searchMine />
                  <span className="text-muted font-condensed font-bold shrink-0">&amp;</span>
                  <PlayerInput value={pair.p2Name} onChange={(v) => updateDirectPair(pair.id, 'p2Name', v)} placeholder="Jugador 2" searchMine />
                  {directPairs.length > 8 && (
                    <button onClick={() => removeDirectPair(pair.id)} className="bg-surface border-0 text-muted px-3 py-2.5 cursor-pointer rounded-sm text-[12px] shrink-0">✕</button>
                  )}
                </div>
              ))}
            </div>

            {directHasDupes && (
              <p className="text-danger text-[11px] font-mono mt-2">Hay nombres duplicados.</p>
            )}

            {directPairs.length < 16 && (
              <button onClick={addDirectPair} className="bg-transparent border border-dashed border-border-strong text-muted px-4 py-2 cursor-pointer font-condensed tracking-wide text-[13px] rounded-sm w-full mt-2">
                + Agregar pareja
              </button>
            )}

            <div className="bg-surface-alt border border-border-strong rounded-md px-3.5 py-2.5 text-[12px] text-soft font-mono leading-relaxed mt-4">
              ✦ {directPairs.length} parejas — {directPairs.length * 2} jugadores.
            </div>

            {error && <p className="text-danger text-xs font-mono mt-2">El nombre del torneo debe tener entre 2 y 30 caracteres</p>}
            <button
              onClick={() => tituloValido ? handleCreateDirect() : setError(true)}
              className={`w-full bg-brand text-base border-0 py-3.5 font-condensed font-black text-[16px] tracking-[2px] rounded-sm mt-7 transition-opacity cursor-pointer ${directPairsValid ? 'opacity-100' : 'opacity-40 cursor-not-allowed'}`}
            >
              CREAR TORNEO
            </button>
          </>
        )}

        {/* ── STEP: pairs (liga con número par de jugadores) ── */}
        {step === "pairs" && (
          <>
            <div className="flex items-center gap-2.5 mb-1">
              <button onClick={() => setStep("players")} className="bg-transparent text-muted border border-border-strong px-3 py-2 text-[13px] cursor-pointer rounded-sm font-sans">← Volver</button>
              <span className="text-muted text-[12px] font-mono">{name} · {filledNames.length} jugadores · LIGA</span>
            </div>

            <PairBuilder players={filledNames} pairs={pairs} onChange={setPairs} />

            <button
              onClick={handleCreate}
              className={`w-full bg-brand text-base border-0 py-3.5 font-condensed font-black text-[16px] tracking-[2px] rounded-sm mt-6 transition-opacity cursor-pointer ${allPairsFilled ? 'opacity-100' : 'opacity-40 cursor-not-allowed'}`}
            >
              CREAR TORNEO
            </button>
          </>
        )}
      </div>
    </div>
  );
}

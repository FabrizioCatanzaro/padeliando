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
  const [name, setName]         = useState("");
  const [playerNames, setPlayerNames] = useState(["", "", "", ""]);
  const [pairs, setPairs]       = useState([]);
  const [step, setStep]         = useState("players");

  const filledNames = playerNames.filter((n) => n.trim());
  console.log("filled",filledNames);
  
  const isEven = filledNames.length > 0 && filledNames.length % 2 === 0;
  const hasDupes = new Set(filledNames.map((n) => n.trim().toLowerCase())).size !== filledNames.length;

  const playersValid = name.trim() && filledNames.length >= 4 && !hasDupes;

  const allPairsFilled =
    pairs.length === filledNames.length / 2 &&
    pairs.every((p) => p.p1Name && p.p2Name);

  function addPlayer()         { setPlayerNames([...playerNames, ""]); }
  function removePlayer(i)     { setPlayerNames(playerNames.filter((_, idx) => idx !== i)); }
  function updatePlayer(i, v)  { const p = [...playerNames]; p[i] = v; setPlayerNames(p); }

  async function onCreate(tournamentName, players, pairsInput) {
    const tId = await createTournament(tournamentName, players, pairsInput);
    navigate(`/groups/${groupId}/tournament/${tId}`);
  }

  function handleNext() {
    if (!playersValid) return;
    if (isEven) {
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
    <div className="bg-base text-content font-sans pb-15">
      <div className="max-w-125 mx-auto px-7 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div onClick={() => navigate(`/groups/${groupId}`)} className="flex flex-row gap-2 items-center w-fit bg-transparent text-muted border border-border-strong px-3 py-2 text-[13px] cursor-pointer rounded-sm font-sans">
            <ChevronLeft size={15} />
            <span>Volver</span>
          </div>
        </div>
        <p className="text-muted font-sans text-[14px] m-0">Creá tu jornada y empezá a crear los partidos</p>

        {step === "players" && (
          <>
            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-2 mt-5">NOMBRE DE LA JORNADA</label>
            <input
              className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 font-sans text-[14px] rounded-sm outline-none mb-2"
              placeholder="ej: Fecha 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-2 mt-5">
              JUGADORES <span className="text-muted">(mínimo 4)</span>
            </label>
            <div className="flex flex-col gap-2">
              {playerNames.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <PlayerInput value={p} onChange={(v) => updatePlayer(i, v)} placeholder={`Jugador ${i + 1}`} />
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

            {filledNames.length >= 4 && (
              <div className="bg-surface-alt border border-border-strong rounded-md px-3.5 py-2.5 text-[12px] text-soft font-mono leading-relaxed mt-4">
                {isEven
                  ? `✦ ${filledNames.length} jugadores — en el siguiente paso armás las ${filledNames.length / 2} parejas fijas.`
                  : `✦ ${filledNames.length} jugadores — número impar, los equipos se armarán partido a partido.`}
              </div>
            )}

            <button
              onClick={handleNext}
              className={`w-full bg-brand text-base border-0 py-3.5 font-condensed font-black text-[16px] tracking-[2px] rounded-sm mt-7 transition-opacity cursor-pointer ${playersValid ? 'opacity-100' : 'opacity-40 cursor-not-allowed'}`}
            >
              {isEven ? "SIGUIENTE → PAREJAS" : "CREAR JORNADA"}
            </button>
          </>
        )}

        {step === "pairs" && (
          <>
            <div className="flex items-center gap-2.5 mb-1">
              <button onClick={() => setStep("players")} className="bg-transparent text-muted border border-border-strong px-3 py-2 text-[13px] cursor-pointer rounded-sm font-sans">← Volver</button>
              <span className="text-muted text-[12px] font-mono">{name} · {filledNames.length} jugadores</span>
            </div>

            <PairBuilder players={filledNames} pairs={pairs} onChange={setPairs} />

            <button
              onClick={handleCreate}
              className={`w-full bg-brand text-base border-0 py-3.5 font-condensed font-black text-[16px] tracking-[2px] rounded-sm mt-6 transition-opacity cursor-pointer ${allPairsFilled ? 'opacity-100' : 'opacity-40 cursor-not-allowed'}`}
            >
              CREAR JORNADA
            </button>
          </>
        )}
      </div>
    </div>
  );
}

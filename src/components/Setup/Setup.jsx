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

  const filledNames = playerNames.filter((n) => n.trim());

  const isEven   = filledNames.length > 0 && filledNames.length % 2 === 0;
  const hasDupes = new Set(filledNames.map((n) => n.trim().toLowerCase())).size !== filledNames.length;

  const minPlayers  = format === 'americano' ? 16 : 4;
  const maxPlayers  = format === 'americano' ? 32 : Infinity;
  const playersValid = name.trim()
    && filledNames.length >= minPlayers
    && filledNames.length <= maxPlayers
    && !hasDupes
    && (format === 'americano' ? filledNames.length % 2 === 0 : true);
  const tituloValido = name?.length <= 30 && name?.length >= 2;

  const allPairsFilled =
    pairs.length === filledNames.length / 2 &&
    pairs.every((p) => p.p1Name && p.p2Name);

  function addPlayer()         { setPlayerNames([...playerNames, ""]); }
  function removePlayer(i)     { setPlayerNames(playerNames.filter((_, idx) => idx !== i)); }
  function updatePlayer(i, v)  { const p = [...playerNames]; p[i] = v; setPlayerNames(p); }

  async function onCreate(tournamentName, players, pairsInput, fmt) {
    const tId = await createTournament(tournamentName, players, pairsInput, fmt);
    navigate(`/groups/${groupId}/tournament/${tId}`);
  }

  function handleNext() {
    if (!playersValid) return;
    const goToPairs = isEven || format === 'americano';
    if (goToPairs) {
      setPairs(Array.from({ length: filledNames.length / 2 }, () => ({ id: uid(), p1Name: "", p2Name: "" })));
      setStep("pairs");
    } else {
      onCreate(name.trim(), filledNames, null, 'liga');
    }
  }

  function handleCreate() {
    if (!allPairsFilled) return;
    onCreate(name.trim(), filledNames, pairs, format);
  }

  function infoBox() {
    if (format === 'americano') {
      if (filledNames.length === 0) return null;
      if (filledNames.length % 2 !== 0)
        return `⚠ ${filledNames.length} jugadores — el número debe ser par para Americano.`;
      if (filledNames.length < 16)
        return `⚠ ${filledNames.length} jugadores — Americano requiere mínimo 16 (8 parejas).`;
      if (filledNames.length > 32)
        return `⚠ ${filledNames.length} jugadores — Americano admite máximo 32 (16 parejas).`;
      return `✦ ${filledNames.length} jugadores — ${filledNames.length / 2} parejas. Siguiente: armá las parejas.`;
    }
    if (filledNames.length < 4) return null;
    return isEven
      ? `✦ ${filledNames.length} jugadores — en el siguiente paso armás las ${filledNames.length / 2} parejas fijas.`
      : `✦ ${filledNames.length} jugadores — número impar, los equipos se armarán partido a partido.`;
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

        {/* ── STEP: formato ── */}
        {step === "formato" && (
          <>
            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-4 mt-5">FORMATO DE LA JORNADA</label>
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
              onClick={() => setStep("players")}
              className="w-full bg-brand text-base border-0 py-3.5 font-condensed font-black text-[16px] tracking-[2px] rounded-sm mt-7 cursor-pointer"
            >
              SIGUIENTE → JUGADORES
            </button>
          </>
        )}

        {/* ── STEP: players ── */}
        {step === "players" && (
          <>
            <div className="flex items-center gap-2.5 mb-4">
              <button onClick={() => setStep("formato")} className="bg-transparent text-muted border border-border-strong px-3 py-2 text-[13px] cursor-pointer rounded-sm font-sans">← Volver</button>
              <span className="text-muted text-[12px] font-mono">{format === 'americano' ? 'AMERICANO' : 'LIGA'}</span>
            </div>

            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-2">NOMBRE DE LA JORNADA</label>
            <input
              className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 font-sans text-[14px] rounded-sm outline-none mb-2"
              placeholder="ej: Fecha 1 - 24/03"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              minLength={2}
            />

            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-1 mt-5">
              JUGADORES{' '}
              <span className="text-muted">
                {format === 'americano' ? '(mínimo 16, máximo 32, número par)' : '(mínimo 4)'}
              </span>
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

            {error && <p className="text-danger text-xs font-mono mt-2">El nombre de la jornada debe tener entre 2 y 30 caracteres</p>}
            <button
              onClick={() => tituloValido ? handleNext() : setError(true)}
              className={`w-full bg-brand text-base border-0 py-3.5 font-condensed font-black text-[16px] tracking-[2px] rounded-sm mt-7 transition-opacity cursor-pointer ${playersValid ? 'opacity-100' : 'opacity-40 cursor-not-allowed'}`}
            >
              {format === 'americano' || isEven ? "SIGUIENTE → PAREJAS" : "CREAR JORNADA"}
            </button>
          </>
        )}

        {/* ── STEP: pairs ── */}
        {step === "pairs" && (
          <>
            <div className="flex items-center gap-2.5 mb-1">
              <button onClick={() => setStep("players")} className="bg-transparent text-muted border border-border-strong px-3 py-2 text-[13px] cursor-pointer rounded-sm font-sans">← Volver</button>
              <span className="text-muted text-[12px] font-mono">{name} · {filledNames.length} jugadores · {format === 'americano' ? 'AMERICANO' : 'LIGA'}</span>
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

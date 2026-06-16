import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { uid } from "../../utils/helpers";
import { useTournament } from "../../hooks/useTournament";
import PlayerInput from "./PlayerInput";
import PairBuilder from "./PairBuilder";
import PremiumModal from "../shared/PremiumModal";
import { ChevronLeft, Check, Lock } from "lucide-react";
import Btn from "../shared/Btn";

function CourtsInput({ isPremium, value, onChange, onOpenPremium }) {
  return (
    <div className="mt-5">
      <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-2">
        CANTIDAD DE CANCHAS
        {!isPremium && <span className="ml-2 text-brand font-mono text-[10px]">PREMIUM</span>}
      </label>
      {isPremium ? (
        <div className="flex gap-2 flex-wrap">
          {[1,2,3,4,5,6,7,8].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`w-10 h-10 rounded-sm border font-mono font-bold text-[14px] cursor-pointer transition-colors ${
                value === n
                  ? 'bg-brand text-base border-brand'
                  : 'bg-surface border-border-mid text-muted hover:border-border-strong'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenPremium}
          className="flex items-center gap-2 bg-surface border border-border-mid text-muted px-3.5 py-2.5 rounded-sm text-[13px] font-sans cursor-pointer hover:border-brand/50 transition-colors w-full"
        >
          <Lock size={13} className="text-brand shrink-0" />
          <span>1 cancha (gratis) — desbloqueá más con Premium</span>
        </button>
      )}
    </div>
  );
}

function StepBar({ steps, currentIdx }) {
  return (
    <div className="flex items-start mb-7">
      {steps.map((s, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.id} className="flex items-start flex-1">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                done   ? 'bg-brand text-base' :
                active ? 'border-2 border-brand text-brand bg-brand/10' :
                         'border border-border-strong text-dim bg-transparent'
              }`}>
                {done ? <Check size={11} strokeWidth={3} /> : i + 1}
              </div>
              <span className={`text-[9px] font-mono tracking-widest whitespace-nowrap transition-colors ${
                active ? 'text-brand' : done ? 'text-muted' : 'text-dim'
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mt-3 mx-1 transition-colors ${done ? 'bg-brand' : 'bg-border-strong'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Setup() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { handleCreate: createTournament, groupOwnerIsPremium } = useTournament(groupId, null);
  const [format, setFormat]       = useState("liga");
  const [name, setName]           = useState("");
  const [playerNames, setPlayerNames] = useState(["", "", "", ""]);
  const [ligaMode, setLigaMode]   = useState("free");
  const [pairs, setPairs]         = useState([]);
  const [step, setStep]           = useState("formato");
  const [error, setError]         = useState(false);
  const [numberOfCourts, setNumberOfCourts] = useState(1);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [creating, setCreating]   = useState(false);

  const [directPairs, setDirectPairs] = useState(() =>
    Array.from({ length: 8 }, () => ({ id: uid(), p1Name: "", p2Name: "" }))
  );

  const filledNames = playerNames.filter((n) => n.trim());
  const isEven   = filledNames.length > 0 && filledNames.length % 2 === 0;
  const hasDupes = new Set(filledNames.map((n) => n.trim().toLowerCase())).size !== filledNames.length;
  const playersValid = name.trim() && filledNames.length >= 4 && !hasDupes;
  const tituloValido = name?.length <= 30 && name?.length >= 2;
  const allPairsFilled = pairs.length === filledNames.length / 2 && pairs.every((p) => p.p1Name && p.p2Name);

  const directPairNames = directPairs.flatMap(p => [p.p1Name.trim(), p.p2Name.trim()]).filter(Boolean);
  const directHasDupes  = new Set(directPairNames.map(n => n.toLowerCase())).size !== directPairNames.length;
  const directAllFilled = directPairs.every(p => p.p1Name.trim() && p.p2Name.trim());
  const directPairsValid = tituloValido && directAllFilled && !directHasDupes;

  // ── Barra de progreso ────────────────────────────────────────────────────
  const flowSteps = format === 'americano'
    ? [{ id: 'formato', label: 'FORMATO' }, { id: 'direct-pairs', label: 'PAREJAS' }]
    : (isEven && ligaMode === 'pairs') || step === 'pairs'
      ? [{ id: 'formato', label: 'FORMATO' }, { id: 'players', label: 'JUGADORES' }, { id: 'pairs', label: 'PAREJAS' }]
      : [{ id: 'formato', label: 'FORMATO' }, { id: 'players', label: 'JUGADORES' }];

  const currentStepIdx = flowSteps.findIndex(s => s.id === step);

  // ── Navegación hacia atrás unificada ─────────────────────────────────────
  function handleBack() {
    if (step === 'formato') navigate(`/cat/${groupId}`);
    else if (step === 'players') setStep('formato');
    else if (step === 'direct-pairs') setStep('formato');
    else if (step === 'pairs') setStep('players');
  }

  function addPlayer()         { setPlayerNames([...playerNames, ""]); }
  function removePlayer(i)     {
    const updated = playerNames.filter((_, idx) => idx !== i);
    setPlayerNames(updated);
    const newFilled = updated.filter((n) => n.trim()).length;
    if (newFilled % 2 !== 0) setLigaMode('free');
    else if (newFilled > 0)  setLigaMode('pairs');
  }
  function updatePlayer(i, v)  {
    const p = [...playerNames];
    const wasEmpty = !p[i].trim();
    p[i] = v;
    setPlayerNames(p);
    const isNowFilled = !!v.trim();
    if (wasEmpty !== !isNowFilled) {
      const newFilled = p.filter((n) => n.trim()).length;
      if (newFilled > 0 && newFilled % 2 === 0) setLigaMode('pairs');
      else setLigaMode('free');
    }
  }

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
    setCreating(true);
    try {
      const tId = await createTournament(tournamentName, players, pairsInput, fmt, numberOfCourts);
      navigate(`/cat/${groupId}/torneo/${tId}`);
    } finally {
      setCreating(false);
    }
  }

  function handleNext() {
    if (!playersValid) return;
    if (isEven && ligaMode === 'pairs') {
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
    if (!isEven) return `✦ ${filledNames.length} jugadores — número impar, los equipos se armarán partido a partido.`;
    if (ligaMode === 'pairs') return `✦ ${filledNames.length} jugadores — en el siguiente paso armás las ${filledNames.length / 2} parejas fijas.`;
    return `✦ ${filledNames.length} jugadores — equipos libres, se armarán partido a partido.`;
  }

  return (
    <div className="bg-base text-content font-sans pb-15">
      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
      <div className="max-w-125 mx-auto px-4 sm:px-7 py-8 sm:py-10">

        {/* Volver unificado */}
        <div className="mb-6">
          <Btn size="sm" icon={ChevronLeft} onClick={handleBack}>
            {step === 'formato' ? 'Volver' : 'Paso anterior'}
          </Btn>
        </div>

        {/* Barra de progreso */}
        <StepBar steps={flowSteps} currentIdx={currentStepIdx} />

        {/* ── STEP: formato ── */}
        {step === "formato" && (
          <>
            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-4">FORMATO DEL TORNEO</label>
            <div className="flex flex-col gap-3">
              <div
                onClick={() => setFormat('liga')}
                className={`bg-surface border rounded-lg p-4 cursor-pointer card-link ${format === 'liga' ? 'border-brand' : 'border-border-mid'}`}
              >
                <div className="font-condensed font-bold text-[16px] text-white mb-1">LIGA</div>
                <div className="text-[12px] text-muted font-sans">Partidos libres o por parejas fijas. Tabla de posiciones acumulada.</div>
              </div>
              <div
                onClick={() => setFormat('americano')}
                className={`bg-surface border rounded-lg p-4 cursor-pointer card-link ${format === 'americano' ? 'border-brand' : 'border-border-mid'}`}
              >
                <div className="font-condensed font-bold text-[16px] text-white mb-1">AMERICANO</div>
                <div className="text-[12px] text-muted font-sans">Fase previa (2 partidos por pareja) + cuadro de eliminación directa. Requiere 8–16 parejas (16–32 jugadores).</div>
              </div>
            </div>
            <Btn variant="primary" full size="lg" onClick={() => setStep(format === 'americano' ? 'direct-pairs' : 'players')} className="mt-7">
              {format === 'americano' ? 'SIGUIENTE → PAREJAS' : 'SIGUIENTE → JUGADORES'}
            </Btn>
          </>
        )}

        {/* ── STEP: players (liga) ── */}
        {step === "players" && (
          <>
            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-2">NOMBRE DEL TORNEO</label>
            <input
              className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 font-sans text-[14px] rounded-sm outline-none mb-2"
              placeholder="ej: Fecha 1 - 24/03"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              minLength={2}
              autoFocus
            />

            <CourtsInput isPremium={groupOwnerIsPremium} value={numberOfCourts} onChange={setNumberOfCourts} onOpenPremium={() => setShowPremiumModal(true)} />

            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-1 mt-5">
              JUGADORES <span className="text-muted">(mínimo 4)</span>
            </label>
            <p className="text-[11px] text-dim font-mono mb-2">Escribí un nombre o <span className="text-brand">@usuario</span> para invitar a alguien registrado.</p>
            <div className="flex flex-col gap-2.5">
              {playerNames.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <PlayerInput value={p} onChange={(v) => updatePlayer(i, v)} placeholder={`Jugador ${i + 1}`} searchMine />
                  {playerNames.length > 4 && (
                    <button onClick={() => removePlayer(i)} className="bg-surface border border-border-mid text-muted px-3 py-2.5 cursor-pointer rounded-sm text-[12px] shrink-0 hover:text-danger hover:border-danger/40 transition-colors">✕</button>
                  )}
                </div>
              ))}
            </div>

            {hasDupes && <p className="text-danger text-[11px] font-mono mt-2">Hay nombres duplicados.</p>}

            <button onClick={addPlayer} className="bg-transparent border border-dashed border-border-strong text-muted px-4 py-2 cursor-pointer font-condensed tracking-wide text-[13px] rounded-sm w-full mt-2">
              + Agregar jugador
            </button>

            {filledNames.length >= 4 && (
              <div className="mt-4">
                <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-2">MODO DE JUEGO</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLigaMode('free')}
                    className={`flex-1 py-2.5 text-[12px] font-condensed font-bold tracking-wide rounded-sm border transition cursor-pointer ${ligaMode === 'free' ? 'bg-brand/15 border-brand text-brand' : 'bg-surface border-border-mid text-muted hover:border-border-strong'}`}
                  >
                    EQUIPOS LIBRES
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (isEven) setLigaMode('pairs'); }}
                    disabled={!isEven}
                    className={`flex-1 py-2.5 text-[12px] font-condensed font-bold tracking-wide rounded-sm border transition ${
                      !isEven
                        ? 'border-border-mid text-dim cursor-not-allowed opacity-40'
                        : ligaMode === 'pairs'
                          ? 'bg-brand/15 border-brand text-brand cursor-pointer'
                          : 'bg-surface border-border-mid text-muted hover:border-border-strong cursor-pointer'
                    }`}
                  >
                    PAREJAS FIJAS
                  </button>
                </div>
                {!isEven && <p className="text-[10px] text-dim font-mono mt-1.5">Número impar de jugadores — parejas fijas no disponible.</p>}
              </div>
            )}

            {infoBox() && (
              <div className="bg-surface-alt border border-border-strong rounded-md px-3.5 py-2.5 text-[12px] text-soft font-mono leading-relaxed mt-4">
                {infoBox()}
              </div>
            )}

            {error && <p className="text-danger text-xs font-mono mt-2">El nombre del torneo debe tener entre 2 y 30 caracteres</p>}
            <Btn variant="primary" full size="lg" onClick={() => tituloValido ? handleNext() : setError(true)} disabled={!playersValid} loading={creating} className="mt-7">
              {isEven && ligaMode === 'pairs' ? "SIGUIENTE → PAREJAS" : "CREAR TORNEO"}
            </Btn>
          </>
        )}

        {/* ── STEP: direct-pairs (americano) ── */}
        {step === "direct-pairs" && (
          <>
            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-2">NOMBRE DEL TORNEO</label>
            <input
              className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 font-sans text-[14px] rounded-sm outline-none mb-2"
              placeholder="ej: Fecha 1 - 24/03"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              minLength={2}
              autoFocus
            />

            <CourtsInput isPremium={groupOwnerIsPremium} value={numberOfCourts} onChange={setNumberOfCourts} onOpenPremium={() => setShowPremiumModal(true)} />

            <label className="block text-[11px] tracking-[2px] text-muted font-mono mb-1 mt-5">
              PAREJAS <span className="text-muted">(mínimo 8, máximo 16)</span>
            </label>
            <p className="text-[11px] text-dim font-mono mb-2">Escribí un nombre o <span className="text-brand">@usuario</span> para invitar a alguien registrado.</p>

            <div className="flex flex-col gap-3">
              {directPairs.map((pair, i) => (
                <div key={pair.id} className="bg-surface border border-border-mid rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-dim text-[11px] font-mono w-5 shrink-0 text-right">{i + 1}</span>
                    <PlayerInput value={pair.p1Name} onChange={(v) => updateDirectPair(pair.id, 'p1Name', v)} placeholder="Jugador 1" searchMine />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted font-condensed font-bold text-[11px] w-5 shrink-0 text-center">&amp;</span>
                    <PlayerInput value={pair.p2Name} onChange={(v) => updateDirectPair(pair.id, 'p2Name', v)} placeholder="Jugador 2" searchMine />
                    {directPairs.length > 8 && (
                      <button onClick={() => removeDirectPair(pair.id)} className="bg-transparent border border-border-mid text-muted px-2.5 py-2.5 cursor-pointer rounded-sm text-[12px] shrink-0 hover:text-danger hover:border-danger/40 transition-colors">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {directHasDupes && <p className="text-danger text-[11px] font-mono mt-2">Hay nombres duplicados.</p>}

            {directPairs.length < 16 && (
              <button onClick={addDirectPair} className="bg-transparent border border-dashed border-border-strong text-muted px-4 py-2 cursor-pointer font-condensed tracking-wide text-[13px] rounded-sm w-full mt-2">
                + Agregar pareja
              </button>
            )}

            <div className="bg-surface-alt border border-border-strong rounded-md px-3.5 py-2.5 text-[12px] text-soft font-mono leading-relaxed mt-4">
              ✦ {directPairs.length} parejas — {directPairs.length * 2} jugadores.
            </div>

            {error && <p className="text-danger text-xs font-mono mt-2">El nombre del torneo debe tener entre 2 y 30 caracteres</p>}
            <Btn variant="primary" full size="lg" onClick={() => tituloValido ? handleCreateDirect() : setError(true)} disabled={!directPairsValid} loading={creating} className="mt-7">
              CREAR TORNEO
            </Btn>
          </>
        )}

        {/* ── STEP: pairs (liga con número par de jugadores) ── */}
        {step === "pairs" && (
          <>
            <div className="text-[12px] text-muted font-mono mb-4">{name} · {filledNames.length} jugadores · LIGA</div>
            <PairBuilder players={filledNames} pairs={pairs} onChange={setPairs} />
            <Btn variant="primary" full size="lg" onClick={handleCreate} disabled={!allPairsFilled} loading={creating} className="mt-6">
              CREAR TORNEO
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}

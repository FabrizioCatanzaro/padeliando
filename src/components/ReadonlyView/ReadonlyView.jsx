import { useState, useEffect, useContext, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { calcStandings, courtLabel, getPairLabel } from "../../utils/helpers";
import Standings from "../Standings/Standings";
import Stats from "../Stats/Stats";
import MatchCard from "../Matches/MatchCard";
import Bracket from "../Americano/Bracket";
import PhotoGallery from "../Photos/PhotoGallery";
import PlayerAvatar, { PairAvatar } from "../shared/PlayerAvatar";
import { api } from '../../utils/api';
import { adaptTournament } from '../../utils/helpers';
import { AuthContext } from '../../context/useAuth';
import { ChartNoAxesCombined, Check, ChevronLeft, ChevronRight, Eye, Flame, Lock, Share2, Split, List, Trophy, User, Zap, Tv, Pause, Play, Volume2, VolumeX, Maximize, Minimize, Clock, X, Calendar, MapPin } from "lucide-react";
import courtSvg from "../../assets/padel-court.svg";
import appLogo from "../../assets/padeleando.svg";
import Badge from "../shared/Badge";
import { TournamentHeaderSkeleton, TabsSkeleton, CardSkeleton } from "../shared/Skeleton";
import Btn from "../shared/Btn";

const PHASE_LABEL = { previa: 'FASE PREVIA', octavos: 'OCTAVOS', cuartos: 'CUARTOS', semis: 'SEMIS', final: 'FINAL' };

// Cantidad de partidos jugados (liga + bracket) — usado para el badge de PJ y
// para disparar el sonido cuando se registra un resultado nuevo.
function countPlayed(t) {
  if (!t) return 0;
  const bracketPlayed = t.format === 'americano'
    ? [...(t.bracket?.octavos ?? []), ...(t.bracket?.cuartos ?? []),
       ...(t.bracket?.semis ?? []), ...(t.bracket?.final ? [t.bracket.final] : [])]
      .filter(m => m.winner_id != null).length
    : 0;
  return t.matches.filter((m) => m.score1 !== "").length + bracketPlayed;
}

const LIGA_TABS = [
  { id: "standings", label: "TABLA",        icon: Trophy },
  { id: "matches",   label: "PARTIDOS",     icon: Flame },
  { id: "players",   label: "JUGADORES",    icon: User },
  { id: "stats",     label: "ESTADÍSTICAS", icon: ChartNoAxesCombined },
];

const AMERICANO_TABS = [
  { id: "standings", label: "TABLA",      icon: Trophy },
  { id: "matches",   label: "PREVIA",     icon: List },
  { id: "bracket",   label: "CUADRO",     icon: Split },
  { id: "stats",     label: "ESTADÍSTICAS", icon: ChartNoAxesCombined },
  { id: "players",   label: "JUGADORES",  icon: User },
];

export default function ReadonlyView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [tournament, setTournament] = useState(null);
  const [groupName, setGroupName]         = useState(null);
  const [groupEmojis, setGroupEmojis]     = useState([]);
  const [groupIsPublic, setGroupIsPublic]       = useState(true);
  const [groupOwner, setGroupOwner]             = useState(null);
  const [groupOwnerIsPremium, setGroupOwnerIsPremium] = useState(false);
  const [error, setError]           = useState(false);
  const [tab, setTab]               = useState("standings");
  const [copied, setCopied]         = useState(false);
  const [joinStatus, setJoinStatus] = useState(null); // { is_player, request }
  const [joinBusy, setJoinBusy]     = useState(false);
  const [hideJoinBanner, setHideJoinBanner] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // ── Modo TV (rotación automática de pantallas) ─────────────────────────────
  // La vista de espectador arranca directo en Modo TV; la cruz (onExit) vuelve al
  // modo normal con tabs.
  const [tvMode, setTvMode]     = useState(true);
  const [tvPaused, setTvPaused] = useState(false);
  const [tvStep, setTvStep]     = useState(0);
  const [soundOn, setSoundOn]   = useState(false);
  const [club, setClub]         = useState(null);
  const audioRef  = useRef(null);
  const soundSigRef = useRef(null);

  async function copyLink() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: tournament?.name ?? 'Torneo',
          text: `¡Te invito a ver "${tournament?.name ?? 'este torneo'}"! Seguí los resultados en vivo acá:`,
          url,
        });
      } catch { /* usuario canceló */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const load = useCallback(async () => {
    try {
      const t = await api.readonly.get(id);
      setTournament(adaptTournament(t));
      if (t.group_id) {
        const g = await api.groups.get(t.group_id);
        setGroupName(g.name);
        setGroupEmojis(g.emojis ?? []);
        setGroupIsPublic(g.is_public ?? true);
        setGroupOwnerIsPremium(g.owner_is_premium ?? false);
        if (g.owner_username) setGroupOwner({ username: g.owner_username, name: g.owner_name });
      }
      setRefreshTick((x) => x + 1);
    } catch {
      setError(true);
    }
  }, [id]);

  const REFRESH_MS = 30_000;
  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  // Datos del club (logo + nombre) para el header del modo TV
  useEffect(() => {
    const cid = tournament?.club_id;
    if (!cid) { setClub(null); return; }
    api.clubs.get(cid).then(setClub).catch(() => setClub(null));
  }, [tournament?.club_id]);

  // ── Sonido (Web Audio, sin assets) ─────────────────────────────────────────
  function ensureAudio() {
    if (!audioRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioRef.current = new AC();
    }
    if (audioRef.current?.state === 'suspended') audioRef.current.resume();
    return audioRef.current;
  }
  function playTone(freqs, step = 0.16) {
    const ac = ensureAudio();
    if (!ac) return;
    const t0 = ac.currentTime;
    freqs.forEach((f, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const start = t0 + i * step;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + step);
      o.connect(g); g.connect(ac.destination);
      o.start(start); o.stop(start + step + 0.02);
    });
  }
  function toggleSound() {
    setSoundOn((v) => {
      const next = !v;
      if (next) playTone([880]); // blip de confirmación (gesto del usuario habilita el audio)
      return next;
    });
  }

  // Detecta cambios entre refrescos y dispara sonidos: resultado nuevo (dos notas)
  // o partido que entra/cambia en vivo (una nota). No suena en la primera carga.
  useEffect(() => {
    if (!tournament) return;
    const live = Array.isArray(tournament.live_match) ? tournament.live_match : [];
    const liveKeys = live
      .filter((m) => m.startedAt != null)
      .map((m) => `${m.team1Label}|${m.team2Label}|${m.court}|${m.phase}`)
      .sort();
    const finished = countPlayed(tournament);
    const prev = soundSigRef.current;
    soundSigRef.current = { liveKeys, finished };
    if (!prev || !soundOn) return;
    if (finished > prev.finished) playTone([660, 990]);            // resultado nuevo
    else if (liveKeys.some((k) => !prev.liveKeys.includes(k))) playTone([990]); // nuevo en vivo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament, soundOn]);

  // Secuencia de pantallas del modo TV (depende del formato y de si hay cuadro)
  const hasBracketTv = tournament?.format === 'americano' && !!tournament?.bracket;
  const tvSequence = useMemo(() => {
    const seq = [
      { screen: 'standings', label: 'TABLA DE POSICIONES', duration: 10000 },
      { screen: 'live',      label: 'PARTIDOS EN VIVO',    duration: 10000 },
    ];
    if (hasBracketTv) seq.push({ screen: 'bracket', label: 'CUADRO', duration: 20000 });
    return seq;
  }, [hasBracketTv]);

  // Mantener el índice dentro del rango si cambia la secuencia (p.ej. aparece el cuadro)
  useEffect(() => {
    setTvStep((s) => (s >= tvSequence.length ? 0 : s));
  }, [tvSequence.length]);

  function toggleTv() {
    setTvMode((v) => {
      const next = !v;
      if (next) { setTvStep(0); setTvPaused(false); }
      return next;
    });
  }
  function nextScreen() { setTvStep((s) => (s + 1) % tvSequence.length); }
  function prevScreen() { setTvStep((s) => (s - 1 + tvSequence.length) % tvSequence.length); }
  function handleBarEnd() {
    if (tvMode && !tvPaused) setTvStep((s) => (s + 1) % tvSequence.length);
  }

  useEffect(() => {
    const tid = tournament?.id;
    if (!user || !tid) return;
    api.joinRequests.myStatus(tid)
      .then(setJoinStatus)
      .catch(() => {});
  }, [user, tournament?.id]);

  async function handleJoinRequest() {
    if (joinBusy) return;
    setJoinBusy(true);
    try {
      const result = await api.joinRequests.send(tournament.id);
      setJoinStatus({ is_player: false, request: result });
    } catch {
      //
    } finally {
      setJoinBusy(false);
    }
  }

  if (error) {
    return (
      <div className="bg-base text-content font-sans pb-15 flex items-center justify-center">
        <div className="text-center text-[#666]">
          <div className="text-[48px] mb-3">🔍</div>
          <div className="text-soft font-mono">Torneo no encontrado.</div>
          <div className="text-muted text-[13px] mt-2">El link puede haber expirado o ser inválido.</div>
        </div>
      </div>
    );
  }

  if (!tournament) return (
    <div className="bg-base text-content font-sans pb-24 sm:pb-15">
      <TournamentHeaderSkeleton />
      <TabsSkeleton count={4} />
      <div className="p-6 flex flex-col gap-3">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
      </div>
    </div>
  );

  const isAmericano = tournament.format === 'americano';
  const TABS = isAmericano ? AMERICANO_TABS : LIGA_TABS;

  // La página normal usa siempre el tab manual; el modo TV vive en su overlay.
  const activeTab   = tab;
  // Barra de progreso de la página: cuenta el próximo refresco (30s).
  const barDuration = REFRESH_MS;
  const barKey      = `refresh-${refreshTick}`;

  let winnerLabel = null;
  if (tournament.status === 'finished') {
    if (isAmericano) {
      if (tournament.bracket?.final?.winner_name) winnerLabel = tournament.bracket.final.winner_name;
    } else {
      const standings = calcStandings(tournament.players, tournament.matches);
      if (tournament.mode === 'pairs' && tournament.pairs?.length > 0) {
        const pairRows = tournament.pairs.map((pair) => {
          const stats  = standings.find((r) => r.id === pair.p1) ?? standings.find((r) => r.id === pair.p2) ?? { pj: 0, pg: 0, sf: 0, sc: 0 };
          const p1Name = tournament.players.find((p) => p.id === pair.p1)?.name ?? '?';
          const p2Name = tournament.players.find((p) => p.id === pair.p2)?.name ?? '?';
          return { ...stats, id: pair.id, name: `${p1Name} & ${p2Name}` };
        }).sort((a, b) => b.pg - a.pg || (b.sf - b.sc) - (a.sf - a.sc));
        const topPg   = pairRows[0]?.pg ?? 0;
        const topDiff = pairRows[0] ? pairRows[0].sf - pairRows[0].sc : 0;
        const top     = pairRows.filter((r) => r.pj > 0 && r.pg === topPg && (r.sf - r.sc) === topDiff);
        if (top.length) winnerLabel = top.map((r) => r.name).join(' / ');
      } else {
        const topPg   = standings[0]?.pg ?? 0;
        const topDiff = standings[0] ? standings[0].sf - standings[0].sc : 0;
        const top     = standings.filter((r) => r.pj > 0 && r.pg === topPg && (r.sf - r.sc) === topDiff);
        if (top.length) winnerLabel = top.map((r) => r.name).join(' / ');
      }
    }
  }

  const bracketPlayed = isAmericano
    ? [...(tournament.bracket?.octavos ?? []), ...(tournament.bracket?.cuartos ?? []),
       ...(tournament.bracket?.semis   ?? []), ...(tournament.bracket?.final ? [tournament.bracket.final] : [])]
      .filter(m => m.winner_id != null).length
    : 0;
  const playedCount = tournament.matches.filter((m) => m.score1 !== "").length + bracketPlayed;

  const MOBILE_LABEL = {
    standings: 'TABLA',
    matches:   isAmericano ? 'PREVIA' : 'PARTIDOS',
    players:   'JUGAD.',
    stats:     'STATS',
    bracket:   'CUADRO',
  };

  return (
    <div className="bg-base text-content font-sans pb-24 sm:pb-15">
      <div className="px-6 pt-5 pb-5 border-b border-border bg-gradient-to-b from-surface/25 to-transparent">
        {/* Breadcrumbs + compartir */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {window.history.length > 1 && (
              <div
                onClick={() => navigate(-1)}
                className="flex flex-row gap-1.5 items-center text-muted border border-border-strong px-2.5 py-1 text-[11px] cursor-pointer rounded-sm font-sans hover:text-white transition-colors"
              >
                <ChevronLeft size={14} />
                <span>Volver</span>
              </div>
            )}
            {groupName && (
              groupIsPublic ? (
                <div
                  onClick={() => navigate(`/cat/${tournament.group_id}`)}
                  className="inline-flex items-center gap-1.5 bg-surface border border-border-mid rounded-full px-3 py-1 cursor-pointer hover:border-border-strong transition-colors"
                >
                  {groupEmojis?.length > 0 && (
                    <span className="text-sm leading-none">{groupEmojis.join(' ')}</span>
                  )}
                  <span className="text-[11px] font-mono text-muted">{groupName}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-surface border border-border-mid rounded-full px-3 py-1">
                  {groupEmojis?.length > 0 && (
                    <span className="text-sm leading-none">{groupEmojis.join(' ')}</span>
                  )}
                  <span className="text-[11px] font-mono text-muted">{groupName}</span>
                  <Lock size={10} className="text-yellow-400" />
                </div>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <Btn variant={tvMode ? 'primary' : 'secondary'} size="sm" onClick={toggleTv} icon={Tv}
              title={tvMode ? 'Salir del modo TV' : 'Modo TV (rotación automática)'} />
            <Btn variant="primary" size="sm" onClick={copyLink} icon={copied ? Check : Share2} />
          </div>
        </div>

        {/* Título */}
        <h1 className="font-condensed font-bold text-[40px] sm:text-[52px] text-white tracking-wide leading-none text-center mb-3">
          {tournament.name}
        </h1>

        {/* Estado + ganador + progreso + dueño */}
        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          <Badge variant="status" color={tournament.status === 'active' ? 'green' : 'default'}>
            {tournament.status === 'active' ? 'EN CURSO' : 'FINALIZADA'}
          </Badge>
          {winnerLabel && (
            <Badge variant="chip" color="brand" icon={Trophy}>{winnerLabel}</Badge>
          )}
          <Badge icon={Flame}>{playedCount} PJ</Badge>
          {groupOwner && (
            <span
              onClick={() => navigate(`/u/${groupOwner.username}`)}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-[#444] hover:text-white cursor-pointer transition-colors"
            >
              <User size={11} />
              @{groupOwner.username}
            </span>
          )}
        </div>
      </div>

      {/* Barra discreta: vista de espectadores + progreso de refresco */}
      <div className="bg-cyan/5 border-b border-cyan/15">
        {/* Barra de progreso (se llena de izquierda a derecha) */}
        <div className="h-1 bg-cyan/10 overflow-hidden">
          <div
            key={barKey}
            className="readonly-progress h-full w-full bg-cyan/50"
            style={{ animationDuration: `${barDuration}ms` }}
          />
        </div>
        <div className="px-6 py-1.5 flex items-center gap-2 flex-wrap">
          <Eye size={11} className="text-cyan/70" />
          <span className="text-[11px] font-mono text-cyan/70">Vista de espectadores</span>
        </div>
      </div>

      {/* Banner de solicitud de unión */}
      {user && tournament?.status === 'active' && joinStatus && !joinStatus.is_player && !joinStatus.is_owner && !hideJoinBanner && (() => {
        const req = joinStatus.request;
        if (!req || req.status === 'rejected') {
          return (
            <div className="px-6 py-2.5 bg-brand/8 border-b border-brand/20 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[12px] font-mono text-brand/80">
                {req?.status === 'rejected' ? 'Tu solicitud fue rechazada.' : '¿Jugás en este torneo?'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleJoinRequest}
                  disabled={joinBusy}
                  className="text-[11px] font-mono px-3 py-1.5 rounded border border-brand text-brand hover:bg-brand hover:text-base cursor-pointer transition-colors disabled:opacity-40"
                >
                  {joinBusy ? 'Enviando...' : req?.status === 'rejected' ? 'Volver a solicitar' : 'Solicitar unirse'}
                </button>
                <button
                  onClick={() => setHideJoinBanner(true)}
                  className="text-brand/60 hover:text-brand cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        }
        if (req.status === 'pending') {
          return (
            <div className="px-6 py-2.5 bg-surface border-b border-border-mid flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-muted">⏳ Solicitud pendiente de aprobación</span>
              <button
                onClick={() => setHideJoinBanner(true)}
                className="text-muted/60 hover:text-muted cursor-pointer transition-colors shrink-0"
              >
                ✕
              </button>
            </div>
          );
        }
        return null;
      })()}

      <LiveTicker tournament={tournament} isAmericano={isAmericano} />

      {/* Tabs — desktop (sm+) */}
      <div className="hidden sm:flex border-b border-border px-4 items-center overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTvMode(false); setTab(t.id); }}
            className={`flex flex-row gap-2 items-center bg-transparent border-0 px-3.5 py-3.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer border-b-2 whitespace-nowrap transition-all hover:text-brand ${activeTab === t.id ? 'text-brand border-b-brand' : 'text-muted border-b-transparent'}`}>
            <t.icon size={15}/>{t.label}
          </button>
        ))}
      </div>

      {/* Bottom nav — mobile only */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-base border-t border-border flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTvMode(false); setTab(t.id); }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 bg-transparent border-0 cursor-pointer transition-colors ${activeTab === t.id ? 'text-brand' : 'text-muted'}`}
          >
            <t.icon size={20} />
            <span className="text-[9px] font-mono tracking-wide leading-none">
              {MOBILE_LABEL[t.id] ?? t.label}
            </span>
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === "standings" && <Standings tournament={tournament} />}
        {activeTab === "stats"     && <Stats     tournament={tournament} ownerIsPremium={groupOwnerIsPremium} />}
        {activeTab === "matches"   && <ReadonlyMatches tournament={tournament} />}
        {activeTab === "players"   && <ReadonlyPlayers tournament={tournament} />}
        {activeTab === "bracket"   && <Bracket tournament={tournament} isOwner={false} />}

        <PhotoGallery tournamentId={tournament.id} isOwner={false} canUpload={false} />
      </div>

      {tvMode && (
        <TvOverlay
          tournament={tournament}
          isAmericano={isAmericano}
          club={club}
          groupName={groupName}
          groupEmojis={groupEmojis}
          seq={tvSequence}
          step={tvStep}
          paused={tvPaused}
          onTogglePause={() => setTvPaused((p) => !p)}
          onPrev={prevScreen}
          onNext={nextScreen}
          onBarEnd={handleBarEnd}
          onExit={() => setTvMode(false)}
          soundOn={soundOn}
          onToggleSound={toggleSound}
          playedCount={playedCount}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODO TV — overlay full-screen tipo scoreboard (rotación automática de pantallas)
// ══════════════════════════════════════════════════════════════════════════════

// Reloj / cualquier tick temporal.
function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

// Fecha larga en español (para el subtítulo del header).
function longEsDate(dstr) {
  const s = dstr ? String(dstr).slice(0, 10) : null;
  const d = s ? new Date(`${s}T00:00:00`) : new Date();
  try {
    return d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  } catch { return ''; }
}

// Contenedor que auto-scrollea lento en vertical (ping-pong) si su contenido no
// entra en el alto disponible. Se reinicia cuando cambia `resetKey`.
// En mobile/tablet (< lg) NO auto-scrollea: el usuario scrollea a mano.
function AutoScrollY({ children, resetKey, speed = 26, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = 0;
    const mq = window.matchMedia('(min-width: 1024px)');
    let raf;
    const start = () => {
      cancelAnimationFrame(raf);
      el.scrollTop = 0;
      // Sólo auto-scrollear en desktop; en pantallas chicas queda el scroll manual.
      if (!mq.matches) return;
      let dir = 1, pos = 0, holdUntil = 0;
      let last = performance.now();
      const tick = (now) => {
        const dt = Math.min(now - last, 64);
        last = now;
        const max = el.scrollHeight - el.clientHeight;
        if (max > 8 && now >= holdUntil) {
          pos += dir * speed * (dt / 1000);
          if (pos >= max)      { pos = max; dir = -1; holdUntil = now + 2500; }
          else if (pos <= 0)   { pos = 0;   dir = 1;  holdUntil = now + 2500; }
          el.scrollTop = pos;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    start();
    mq.addEventListener('change', start);
    return () => { cancelAnimationFrame(raf); mq.removeEventListener('change', start); };
  }, [resetKey, speed]);
  return <div ref={ref} className={`h-full overflow-x-hidden overflow-y-auto lg:overflow-hidden ${className}`}>{children}</div>;
}

// Botón circular de la barra superior.
function TvIconBtn({ children, onClick, title, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-full border transition-colors cursor-pointer shrink-0 ${
        active ? 'border-brand/50 text-brand bg-brand/10' : 'border-border-mid text-muted bg-surface hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function TvClock() {
  const now = useNow(1000);
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return (
    <div className="hidden sm:flex items-center gap-2 px-3 h-9 lg:h-10 rounded-full border border-border-mid bg-surface">
      <Clock size={14} className="text-brand" />
      <span className="font-mono text-[13px] lg:text-[15px] text-white tabular-nums tracking-wide">{hh}:{mm}:{ss}</span>
    </div>
  );
}

function FullscreenBtn() {
  const [fs, setFs] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);
  useEffect(() => {
    const h = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };
  return (
    <TvIconBtn title={fs ? 'Salir de pantalla completa' : 'Pantalla completa'} onClick={toggle}>
      {fs ? <Minimize size={16} /> : <Maximize size={16} />}
    </TvIconBtn>
  );
}

function TvHeader({ tournament, club, groupName, groupEmojis, paused, onPrev, onNext, onTogglePause, soundOn, onToggleSound, onExit }) {
  const isActive = tournament.status === 'active';
  const clubName = club?.name ?? tournament.club_name ?? null;
  const clubLogo = club?.photo_url ?? null;
  const dateLabel = longEsDate(tournament.event_date);

  return (
    <header className="shrink-0 flex items-start gap-3 lg:gap-5 px-4 lg:px-8 py-3 border-b border-border bg-gradient-to-b from-surface/40 to-transparent">
      {/* Logo del club (o de la app como fallback) */}
      <div className="shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-xl border border-border-mid bg-surface overflow-hidden flex items-center justify-center">
        {clubLogo
          ? <img src={clubLogo} alt={clubName ?? ''} className="w-full h-full object-contain" />
          : <img src={appLogo} alt="" className="w-8 h-8 lg:w-10 lg:h-10 object-contain opacity-80" />}
      </div>

      {/* Título + estado + club + categoría + fecha */}
      <div className="min-w-0 flex-1">
        <h1 className="font-condensed font-bold text-white text-[20px] lg:text-[30px] leading-tight tracking-wide">
          {tournament.name}
        </h1>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono tracking-wide ${
            isActive ? 'border-green/40 text-green bg-green/10' : 'border-border-mid text-muted bg-surface'
          }`}>
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />}
            {isActive ? 'TORNEO EN VIVO' : 'FINALIZADO'}
          </span>
          {clubName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border-mid bg-surface text-[10px] font-mono tracking-wide text-soft">
              <MapPin size={11} className="text-brand/60" />
              <span className="max-w-[160px] truncate">{clubName}</span>
            </span>
          )}
          {groupName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-brand/40 bg-gradient-to-b from-brand/15 to-brand/5 text-[10px] font-condensed font-bold tracking-wide text-white">
              <Trophy size={12} className="text-brand" />
              {groupEmojis?.length > 0 && <span>{groupEmojis.join(' ')}</span>}
              {groupName}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-wide text-muted">
            <Calendar size={11} />{dateLabel}
          </span>
        </div>
      </div>

      {/* Controles — en mobile: navegación arriba, iconos abajo */}
      <div className="shrink-0 flex flex-col items-end gap-2 lg:flex-row lg:items-center lg:gap-2.5">
        <div className="flex items-center rounded-full border border-border-mid bg-surface overflow-hidden h-9 lg:h-10">
          <button onClick={onPrev} title="Pantalla anterior" className="px-2 h-full text-muted hover:text-white transition-colors cursor-pointer">
            <ChevronLeft size={16} />
          </button>
          <button onClick={onTogglePause} title={paused ? 'Reanudar' : 'Pausar'} className="px-3 h-full border-x border-border-mid text-brand hover:text-white transition-colors cursor-pointer flex items-center gap-1.5">
            {paused ? <Play size={15} /> : <Pause size={15} />}
            <span className="font-mono text-[10px] tracking-wide hidden lg:inline">{paused ? 'PLAY' : 'PAUSA'}</span>
          </button>
          <button onClick={onNext} title="Pantalla siguiente" className="px-2 h-full text-muted hover:text-white transition-colors cursor-pointer">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2 lg:gap-2.5">
          <TvIconBtn title={soundOn ? 'Silenciar' : 'Activar sonido'} onClick={onToggleSound} active={soundOn}>
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </TvIconBtn>
          <FullscreenBtn />
          <TvClock />
          <TvIconBtn title="Salir del modo TV" onClick={onExit}><X size={16} /></TvIconBtn>
        </div>
      </div>
    </header>
  );
}

// ── Pantalla: TABLA DE POSICIONES ──────────────────────────────────────────────
function TvStandingsScreen({ tournament }) {
  return (
    <AutoScrollY resetKey={`st-${tournament.matches.length}-${tournament.pairs.length}`} className="px-4 lg:px-8 py-5">
      <div className="max-w-4xl mx-auto">
        <Standings tournament={tournament} />
      </div>
    </AutoScrollY>
  );
}

// ── Pantalla: PARTIDOS EN VIVO ─────────────────────────────────────────────────
function TvLiveScreen({ tournament, isAmericano }) {
  const all = Array.isArray(tournament.live_match) ? tournament.live_match : [];
  const enVivo   = all.filter((m) => m.startedAt != null);
  const proximos = all.filter((m) => m.startedAt == null);

  if (all.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
        <Zap size={44} className="text-border-strong" />
        <div className="font-condensed font-bold text-[26px] text-muted tracking-wide">No hay partidos en vivo</div>
        <div className="text-[15px] text-dim">Cuando arranque un partido, aparecerá acá.</div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-4 lg:gap-6 px-4 lg:px-8 py-5">
      {/* En juego */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2 font-condensed font-bold text-[16px] tracking-[3px] text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" /> PARTIDOS EN JUEGO
          </div>
          <span className="font-mono text-[11px] text-muted">{enVivo.length} ACTIVO(S)</span>
        </div>
        {enVivo.length > 0 ? (
          <AutoScrollY resetKey={`live-${enVivo.length}`} className="flex-1">
            <div className={enVivo.length === 1 ? 'grid grid-cols-1 gap-5 max-w-3xl' : 'grid grid-cols-1 xl:grid-cols-2 gap-5'}>
              {enVivo.map((m, i) => (
                <LiveCourt key={i} match={m} tournament={tournament} isAmericano={isAmericano} avatarSize={40} />
              ))}
            </div>
          </AutoScrollY>
        ) : (
          <div className="flex-1 flex items-center justify-center text-dim font-mono text-[13px]">
            Aún no arrancó ningún partido.
          </div>
        )}
      </div>

      {/* Próximos */}
      {proximos.length > 0 && (
        <div className="w-72 xl:w-80 shrink-0 flex flex-col">
          <div className="flex items-center gap-2 mb-3 shrink-0 font-condensed font-bold text-[15px] tracking-[2px] text-muted">
            <Calendar size={15} /> PRÓXIMOS PARTIDOS
          </div>
          <AutoScrollY resetKey={`prox-${proximos.length}`} className="flex-1">
            <div className="flex flex-col gap-3">
              {proximos.map((m, i) => (
                <ProximoMatch key={i} match={m} tournament={tournament} isAmericano={isAmericano} avatarSize={26} />
              ))}
            </div>
          </AutoScrollY>
        </div>
      )}
    </div>
  );
}

// ── Pantalla: CUADRO ───────────────────────────────────────────────────────────
function TvBracketScreen({ tournament }) {
  return (
    <AutoScrollY resetKey={`br-${countPlayed(tournament)}`} className="px-4 lg:px-8 py-5">
      <div className="max-w-6xl mx-auto">
        <Bracket tournament={tournament} isOwner={false} />
      </div>
    </AutoScrollY>
  );
}

function TvOverlay({ tournament, isAmericano, club, groupName, groupEmojis, seq, step, paused, onTogglePause, onPrev, onNext, onBarEnd, onExit, soundOn, onToggleSound, playedCount }) {
  const current = seq[step] ?? seq[0];
  const screen  = current?.screen ?? 'standings';

  // Bloquear scroll del body + atajos de teclado mientras el overlay está abierto.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape')           onExit();
      else if (e.key === 'ArrowRight')  onNext();
      else if (e.key === 'ArrowLeft')   onPrev();
      else if (e.key === ' ')           { e.preventDefault(); onTogglePause(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onExit, onNext, onPrev, onTogglePause]);

  return (
    <div className="fixed inset-0 z-50 bg-base text-content font-sans flex flex-col overflow-hidden">
      {/* Barra de progreso de la pantalla actual */}
      <div className="h-1 bg-brand/10 shrink-0 overflow-hidden">
        <div
          key={`tvbar-${step}`}
          onAnimationEnd={onBarEnd}
          className="readonly-progress h-full bg-brand"
          style={{ animationDuration: `${current?.duration ?? 12000}ms`, animationPlayState: paused ? 'paused' : 'running' }}
        />
      </div>

      <TvHeader
        tournament={tournament}
        club={club}
        groupName={groupName}
        groupEmojis={groupEmojis}
        paused={paused}
        onPrev={onPrev}
        onNext={onNext}
        onTogglePause={onTogglePause}
        soundOn={soundOn}
        onToggleSound={onToggleSound}
        onExit={onExit}
      />

      {/* Contenido principal */}
      <main className="flex-1 min-h-0 relative">
        {screen === 'standings' && <TvStandingsScreen tournament={tournament} />}
        {screen === 'live'      && <TvLiveScreen tournament={tournament} isAmericano={isAmericano} />}
        {screen === 'bracket'   && <TvBracketScreen tournament={tournament} />}
      </main>

      {/* Live ticker (parte inferior) */}
      <div className="shrink-0">
        <LiveTicker tournament={tournament} isAmericano={isAmericano} />
      </div>

      {/* Footer — crédito de la app */}
      <footer className="shrink-0 flex items-center justify-between px-4 lg:px-8 py-2 border-t border-border bg-surface/40">
        <div className="flex items-center gap-2">
          <img src={appLogo} alt="" className="w-5 h-5 object-contain opacity-70" />
          <span className="font-mono text-[10px] tracking-[2px] text-muted">CREADO POR PADELEANDO</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-dim">
          <Flame size={12} className="text-brand/60" /> {playedCount} PARTIDOS JUGADOS
        </div>
      </footer>
    </div>
  );
}

function ProximoTeam({ players, align, avatarSize }) {
  return (
    <div className={`flex-1 flex items-center gap-2 lg:gap-3 min-w-0 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <div className="flex -space-x-1.5 shrink-0">
        {players.map((p, i) => (
          <PlayerAvatar key={i} name={p.name} src={p.src} size={avatarSize} premium={p.premium} />
        ))}
      </div>
      <span className="font-condensed font-bold text-[14px] sm:text-[15px] lg:text-[22px] text-white truncate">
        {players.map((p) => p.name).join(" & ")}
      </span>
    </div>
  );
}

function ProximoMatch({ match, tournament, isAmericano, avatarSize }) {
  const court = courtLabel(tournament, match.court);
  const phase = isAmericano && match.phase ? (PHASE_LABEL[match.phase] ?? match.phase.toUpperCase()) : null;
  const team1 = splitNames(match.team1Label).map((n) => resolveCourtPlayer(n, tournament));
  const team2 = splitNames(match.team2Label).map((n) => resolveCourtPlayer(n, tournament));
  const chipCls = "inline-flex items-center border border-border-strong rounded-sm px-1.5 lg:px-2.5 py-0.5 lg:py-1 text-[10px] lg:text-[14px] font-mono font-bold text-muted";

  return (
    <div className="bg-surface border border-border-mid rounded-lg px-4 lg:px-6 py-3 lg:py-4">
      {(phase || court != null) && (
        <div className="flex items-center gap-1.5 lg:gap-2 mb-2 lg:mb-3">
          {phase && <span className={chipCls}>{phase}</span>}
          {court != null && <span className={chipCls}>CANCHA {court}</span>}
        </div>
      )}
      <div className="flex items-center gap-3 lg:gap-5">
        <ProximoTeam players={team1} align="left" avatarSize={avatarSize} />
        <span className="text-muted font-mono text-[11px] lg:text-[15px] shrink-0">vs</span>
        <ProximoTeam players={team2} align="right" avatarSize={avatarSize} />
      </div>
    </div>
  );
}

// Ubicación de cada jugador dentro de la cancha (la red divide en 50%).
// Equipo 1 → mitad izquierda; equipo 2 → mitad derecha.
const TEAM1_POS = {
  1: [{ left: "25%", top: "50%" }],
  2: [{ left: "25%", top: "30%" }, { left: "25%", top: "70%" }],
};
const TEAM2_POS = {
  1: [{ left: "75%", top: "50%" }],
  2: [{ left: "75%", top: "30%" }, { left: "75%", top: "70%" }],
};

function splitNames(label) {
  return String(label ?? "")
    .split(/\s*&\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function CourtName({ pos, player, side, avatarSize = 22 }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 max-w-[46%]"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className={`flex items-center gap-1.5 lg:gap-2.5 pl-1 pr-3 lg:pr-4 py-1 lg:py-1.5 rounded-full border shadow-lg ${side === 1 ? "bg-brand border-brand" : "bg-cyan border-cyan"}`}>
        <PlayerAvatar name={player.name} src={player.src} size={avatarSize} premium={player.premium} />
        <span className="font-condensed font-bold text-[12px] sm:text-[15px] lg:text-[22px] leading-none text-black truncate">{player.name}</span>
      </div>
    </div>
  );
}

// Cronómetro que tickea desde el timestamp de inicio del partido.
function CourtTimer({ startedAt }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const secs = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return (
    <div className="flex items-center gap-1.5 lg:gap-2 bg-base/85 border border-brand/40 backdrop-blur-sm rounded-full px-3 lg:px-4 py-1 lg:py-1.5 shadow-lg">
      <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-brand animate-pulse" />
      <span className="font-mono text-[13px] sm:text-[15px] lg:text-[22px] text-brand tabular-nums tracking-wide">{mm}:{ss}</span>
    </div>
  );
}

// Resuelve un nombre del label a su jugador (para foto y premium).
function resolveCourtPlayer(name, tournament) {
  const p = tournament.players?.find((pl) => pl.name === name);
  return { name, src: p?.linked_avatar_url ?? null, premium: p?.is_premium ?? false };
}

function LiveCourt({ match, tournament, isAmericano, avatarSize = 22 }) {
  const team1 = splitNames(match.team1Label).map((n) => resolveCourtPlayer(n, tournament));
  const team2 = splitNames(match.team2Label).map((n) => resolveCourtPlayer(n, tournament));
  const pos1 = TEAM1_POS[Math.min(team1.length, 2)] ?? TEAM1_POS[2];
  const pos2 = TEAM2_POS[Math.min(team2.length, 2)] ?? TEAM2_POS[2];
  const court = courtLabel(tournament, match.court);
  const phase = isAmericano && match.phase ? (PHASE_LABEL[match.phase] ?? match.phase.toUpperCase()) : null;
  const chipCls = "bg-base/85 border border-brand/40 backdrop-blur-sm rounded-full px-2.5 lg:px-3.5 py-0.5 lg:py-1 font-mono text-[10px] sm:text-[11px] lg:text-[16px] text-brand tracking-wide shadow-lg";

  return (
    <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border border-brand/25 shadow-xl">
      <img src={courtSvg} alt="" className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" />

      {/* Fase / cancha — franja superior de la imagen, fuera de la cancha */}
      {(phase || court != null) && (
        <div className="absolute left-1/2 top-[9%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap z-10">
          {phase && <span className={chipCls}>{phase}</span>}
          {court != null && <span className={chipCls}>CANCHA {court}</span>}
        </div>
      )}

      {/* Jugadores ubicados */}
      {team1.map((p, idx) => (
        <CourtName key={`a${idx}`} pos={pos1[idx] ?? pos1[pos1.length - 1]} player={p} side={1} avatarSize={avatarSize} />
      ))}
      {team2.map((p, idx) => (
        <CourtName key={`b${idx}`} pos={pos2[idx] ?? pos2[pos2.length - 1]} player={p} side={2} avatarSize={avatarSize} />
      ))}

      {/* VS sobre la red */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-9 h-9 sm:w-11 sm:h-11 lg:w-14 lg:h-14 rounded-full bg-base/85 border border-brand/40 backdrop-blur-sm flex items-center justify-center">
          <span className="font-condensed font-bold text-brand text-[12px] sm:text-[14px] lg:text-[18px]">VS</span>
        </div>
      </div>

      {/* Cronómetro — franja inferior de la imagen */}
      {match.startedAt != null && (
        <div className="absolute left-1/2 top-[91%] -translate-x-1/2 -translate-y-1/2 z-10">
          <CourtTimer startedAt={match.startedAt} />
        </div>
      )}
    </div>
  );
}

// Etiqueta de un equipo (array de ids) → "Nombre1 & Nombre2"
function teamLabel(team, tournament) {
  const { players, pairs, mode } = tournament;
  if (mode === "pairs") {
    const pair = pairs?.find(
      (p) => (p.p1 === team[0] && p.p2 === team[1]) || (p.p1 === team[1] && p.p2 === team[0])
    );
    if (pair) return getPairLabel(pair.id, pairs, players);
  }
  return (team ?? []).map((id) => players.find((p) => p.id === id)?.name ?? "?").join(" & ");
}

// Carrusel horizontal que va pasando partidos en vivo + resultados recientes.
// Resultados jugados del cuadro (americano), de más reciente (final) a más
// antiguo (octavos), para incluirlos en el ticker junto con los de la previa.
function bracketRecentItems(tournament) {
  const b = tournament.bracket;
  if (!b) return [];
  const byPhase = [
    ["final",   b.final ? [b.final] : []],
    ["semis",   b.semis   ?? []],
    ["cuartos", b.cuartos ?? []],
    ["octavos", b.octavos ?? []],
  ];
  const out = [];
  for (const [phase, matches] of byPhase) {
    for (const m of matches) {
      if (m.winner_id == null || !m.pair1_name || !m.pair2_name) continue;
      out.push({
        key: `bracket-${m.id}`,
        type: "recent",
        court: courtLabel(tournament, m.court),
        phase,
        team1: m.pair1_name,
        team2: m.pair2_name,
        s1: m.score1,
        s2: m.score2,
        win1: m.winner_id === m.pair1_id,
      });
    }
  }
  return out;
}

function LiveTicker({ tournament, isAmericano }) {
  const maskRef = useRef(null);
  const setRef  = useRef(null);
  const [scroll, setScroll] = useState(false);

  const live = Array.isArray(tournament.live_match) ? tournament.live_match : [];

  const liveItems = live
    .filter((m) => m.startedAt != null)
    .map((m, i) => ({
      key: `live-${i}`,
      type: "live",
      phase: isAmericano ? m.phase : null,
      court: courtLabel(tournament, m.court),
      team1: m.team1Label,
      team2: m.team2Label,
    }));

  const previaItems = tournament.matches
    .filter((m) => m.score1 !== "" && m.score2 !== "")
    .slice(0, 8)
    .map((m, i) => {
      const s1 = m.sets_format === 1 ? (m.sets?.[0]?.s1 ?? m.score1) : m.score1;
      const s2 = m.sets_format === 1 ? (m.sets?.[0]?.s2 ?? m.score2) : m.score2;
      return {
        key: `recent-${m.id ?? i}`,
        type: "recent",
        court: courtLabel(tournament, m.court),
        phase: m.phase ?? (isAmericano ? "previa" : null),
        team1: teamLabel(m.team1, tournament),
        team2: teamLabel(m.team2, tournament),
        s1,
        s2,
        win1: parseInt(s1) > parseInt(s2),
      };
    });

  // Los resultados del cuadro son más recientes que los de la previa → primero.
  const recentItems = [...(isAmericano ? bracketRecentItems(tournament) : []), ...previaItems].slice(0, 10);

  // Deduplicar por contenido (por si live_match trae entradas repetidas).
  const seen = new Set();
  const items = [...liveItems, ...recentItems].filter((it) => {
    const sig = it.type === "live"
      ? `live|${it.phase}|${it.team1}|${it.team2}`
      : `recent|${it.phase}|${it.team1}|${it.team2}|${it.s1}|${it.s2}`;
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });

  // Sólo animar/duplicar cuando el contenido no entra en el ancho disponible;
  // si entra, se muestra una sola vez (sin la copia del marquee).
  useEffect(() => {
    const mask = maskRef.current, set = setRef.current;
    if (!mask || !set) return;
    const check = () => setScroll(set.scrollWidth > mask.clientWidth + 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(mask);
    ro.observe(set);
    return () => ro.disconnect();
  }, [items.length]);

  if (items.length === 0) return null;

  const duration = Math.max(items.length * 7, 22);

  return (
    <div ref={maskRef} className="ticker-mask relative overflow-hidden border-b border-brand/20 bg-gradient-to-r from-brand/5 via-transparent to-brand/5">
      <div className={`ticker-track flex items-stretch py-2.5 ${scroll ? "ticker-animate" : ""}`} style={scroll ? { animationDuration: `${duration}s` } : undefined}>
        <div ref={setRef} className="flex items-stretch shrink-0">
          {items.map((it, i) => (
            <TickerItem key={`${it.key}-a-${i}`} item={it} />
          ))}
        </div>
        {scroll && (
          <div className="flex items-stretch shrink-0" aria-hidden="true">
            {items.map((it, i) => (
              <TickerItem key={`${it.key}-b-${i}`} item={it} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TickerItem({ item }) {
  const isLive = item.type === "live";
  const phaseLabel = item.phase ? (PHASE_LABEL[item.phase] ?? item.phase.toUpperCase()) : null;
  const hasTitle = isLive || item.court != null || phaseLabel;
  const sep = isLive ? "text-brand/30" : "text-border-strong";
  const meta = isLive ? "text-brand/70" : "text-brand/30";

  return (
    <div className={`mr-3 shrink-0 whitespace-nowrap flex flex-col items-center gap-0.5 rounded-xl border px-4 py-1.5 ${isLive ? "bg-brand/12 border-brand/30" : "bg-surface border-border-mid"}`}>
      {/* Título: estado · cancha · fase */}
      {hasTitle && (
        <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-wide leading-none">
          {isLive && (
            <span className="flex items-center gap-1 text-brand">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              EN VIVO
            </span>
          )}
          {item.court != null && (
            <>
              {isLive && <span className={sep}>·</span>}
              <span className={meta}>CANCHA {item.court}</span>
            </>
          )}
          {phaseLabel && (
            <>
              {(isLive || item.court != null) && <span className={sep}>·</span>}
              <span className={meta}>{phaseLabel}</span>
            </>
          )}
        </div>
      )}

      {/* Equipos + resultado */}
      {isLive ? (
        <div className="flex items-center gap-2">
          <span className="font-condensed font-bold text-[14px] text-white">{item.team1}</span>
          <span className="font-mono text-[10px] text-muted">vs</span>
          <span className="font-condensed font-bold text-[14px] text-white">{item.team2}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className={`font-condensed font-semibold text-[14px] ${item.win1 ? "text-brand" : "text-secondary"}`}>{item.team1}</span>
          <span className="font-condensed font-black text-[15px]">
            <span className={item.win1 ? "text-brand" : "text-secondary"}>{item.s1}</span>
            <span className="text-border-strong mx-0.5">–</span>
            <span className={!item.win1 ? "text-cyan" : "text-secondary"}>{item.s2}</span>
          </span>
          <span className={`font-condensed font-semibold text-[14px] ${!item.win1 ? "text-cyan" : "text-secondary"}`}>{item.team2}</span>
        </div>
      )}
    </div>
  );
}

function ReadonlyMatches({ tournament }) {
  const played = tournament.matches.filter((m) => m.score1 !== "" && m.score2 !== "");
  if (played.length === 0)
    return <div className="text-center text-dim py-10 font-sans">No hay partidos jugados todavía.</div>;
  return (
    <div className="flex flex-col gap-2.5">
      {played.map((m, i) => (
        <MatchCard key={m.id} match={m} tournament={tournament} isOwner={false} matchNum={played.length - i} />
      ))}
    </div>
  );
}

function ReadonlyPlayers({ tournament }) {
  const navigate = useNavigate();
  const { players, pairs, mode } = tournament;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted mb-3">JUGADORES</div>
        {players.length === 0
          ? <div className="text-dim font-sans text-sm">No hay jugadores registrados.</div>
          : (
            <div className="flex flex-col gap-2">
              {players.map((p, i) => {
                const username = p.linked_username ?? null;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 bg-surface border border-border-mid rounded-md px-3.5 py-2.5 ${username ? 'cursor-pointer hover:border-border-strong transition-colors' : ''}`}
                    onClick={() => username && navigate(`/u/${username}`)}
                  >
                    <div className="min-w-6 text-muted font-mono font-bold text-[13px]">{i + 1}</div>
                    <PlayerAvatar name={p.name} src={p.linked_avatar_url ?? null} size={28} premium={p.is_premium ?? false} />
                    <div className={`font-semibold ${username ? 'text-white' : 'text-white'}`}>{p.name}</div>
                    {username && <div className="ml-auto text-[11px] font-mono text-dim">@{username}</div>}
                  </div>
                );
              })}
            </div>
          )
        }
      </div>

      {mode === "pairs" && pairs.length > 0 && (
        <div>
          <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted mb-3">PAREJAS</div>
          <div className="flex flex-col gap-2">
            {pairs.map((pair, i) => {
              const player1 = players.find((p) => p.id === pair.p1);
              const player2 = players.find((p) => p.id === pair.p2);
              const p1 = player1?.name ?? "?";
              const p2 = player2?.name ?? "?";
              return (
                <div key={pair.id} className="flex items-center gap-3 bg-surface border border-border-mid rounded-md px-3.5 py-2.5">
                  <div className="min-w-6 text-muted font-mono font-bold text-[13px]">{i + 1}</div>
                  <PairAvatar
                    name1={p1}
                    name2={p2}
                    src1={player1?.linked_avatar_url ?? null}
                    src2={player2?.linked_avatar_url ?? null}
                    size={26}
                  />
                  <div className="text-white font-semibold">{p1} <span className="text-muted">&</span> {p2}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

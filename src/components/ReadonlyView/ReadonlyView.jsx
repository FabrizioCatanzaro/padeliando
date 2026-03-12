import { useState, useEffect } from "react";
import S, { FONTS } from "../../styles/theme";
import { fmt } from "../../utils/helpers";
import Loader from "../Loader/Loader";
import Standings from "../Standings/Standings";
import Stats from "../Stats/Stats";
import { api } from '../../utils/api';
import { adaptTournament } from '../../utils/helpers';


const TABS = [
  { id: "standings", label: "TABLA", icon: "🏆" },
  { id: "stats",     label: "ESTADÍSTICAS", icon: "📊" },
];

export default function ReadonlyView({ id }) {
  const [tournament, setTournament] = useState(null);
  const [error, setError]           = useState(false);
  const [tab, setTab]               = useState("standings");

  useEffect(() => {
    async function load() {
      try {
        const t = await api.readonly.get(id);
        setTournament(adaptTournament(t));
      } catch {
        setError(true);
      }
    }

    load();
    // Poll every 10 seconds so the view stays fresh without a manual refresh
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [id]);

  if (error) {
    return (
      <div
        style={{
          ...S.page,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{FONTS}</style>
        <div style={{ textAlign: "center", color: "#666" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ color: "#aaa", fontFamily: "'Courier New', monospace" }}>
            Torneo no encontrado.
          </div>
          <div style={{ color: "#555", fontSize: 13, marginTop: 8 }}>
            El link puede haber expirado o ser inválido.
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) return <Loader />;

  const playedCount = tournament.matches.filter((m) => m.score1 !== "").length;

  return (
    <div style={S.page}>
      <style>{FONTS}</style>

      <div style={S.header}>
        <div>
          <div style={{...S.logo, cursor: "pointer"}} onClick={() => { window.location.hash = "/"; }}>
            🎾 PADEL<span style={{ color: "#e8f04a" }}>EANDO</span>
          </div>
          <div style={S.tourneyName}>{tournament.name}</div>
          <div style={S.meta}>
            Creado el {fmt(tournament.createdAt)} ·{" "}
            {tournament.players.length} jugadores
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div style={S.readonlyBadge}>👁 SOLO LECTURA</div>
          <div style={{ color: "#444", fontSize: 11, fontFamily: "'Courier New', monospace" }}>
            {playedCount} partidos jugados · actualiza cada 10s
          </div>
        </div>
      </div>

      <div style={S.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ ...S.tab, ...(tab === t.id ? S.tabActive : {}) }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={S.content}>
        {tab === "standings" && <Standings tournament={tournament} />}
        {tab === "stats"     && <Stats     tournament={tournament} />}
      </div>
    </div>
  );
}
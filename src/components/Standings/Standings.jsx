import { calcStandings } from "../../utils/helpers";
import S from "../../styles/theme";

export default function Standings({ tournament }) {
  const rows = calcStandings(tournament.players, tournament.matches);

  return (
    <div>
      <div style={S.sectionTitle}>TABLA DE POSICIONES</div>
      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>#</th>
              <th style={{ ...S.th, textAlign: "left" }}>JUGADOR</th>
              <th style={S.th}>PJ</th>
              <th style={S.th}>PG</th>
              <th style={S.th}>PP</th>
              <th style={S.th}>GF</th>
              <th style={S.th}>GC</th>
              <th style={S.th}>DIF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                <td
                  style={{
                    ...S.td,
                    color:
                      i === 0 ? "#e8f04a"
                      : i === 1 ? "#aaa"
                      : i === 2 ? "#cd7f32"
                      : "#555",
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </td>
                <td
                  style={{
                    ...S.td,
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#fff",
                  }}
                >
                  {r.name}
                </td>
                <td style={S.td}>{r.pj}</td>
                <td style={{ ...S.td, color: "#e8f04a", fontWeight: 700 }}>
                  {r.pg}
                </td>
                <td style={{ ...S.td, color: "#f04a4a" }}>{r.pp}</td>
                <td style={S.td}>{r.sf}</td>
                <td style={S.td}>{r.sc}</td>
                <td
                  style={{
                    ...S.td,
                    color: r.sf - r.sc >= 0 ? "#4af07a" : "#f04a4a",
                    fontWeight: 700,
                  }}
                >
                  {r.sf - r.sc > 0 ? "+" : ""}
                  {r.sf - r.sc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={S.legend}>
        PJ: Partidos Jugados · PG: Ganados · PP: Perdidos · GF: Games a Favor ·
        GC: Games en Contra
      </div>
    </div>
  );
}
// Bloque de estadísticas avanzadas del perfil. Vive aparte porque es lo único
// que usa Recharts (111 KB en red) y sólo se muestra si mirás tu propio perfil,
// siendo premium y con partidos jugados. Importado de forma estática arrastraba
// esa librería a toda visita de perfil, incluida la de un anónimo que nunca la
// ve. ProfileView lo carga con React.lazy.
import { Lock } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-border-strong rounded px-3 py-2 text-xs font-mono">
      <div className="text-muted mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}{p.unit ?? ''}</div>
      ))}
    </div>
  );
}

// ── Heatmap de actividad ──────────────────────────────────────────────────────
const HEATMAP_COLORS = [
  '#111',                    // 0 — sin actividad
  'rgba(232,240,74,0.22)',   // 1
  'rgba(232,240,74,0.45)',   // 2
  'rgba(232,240,74,0.70)',   // 3
  '#e8f04a',                 // 4+
];

function heatColor(n) {
  if (n <= 0) return HEATMAP_COLORS[0];
  if (n === 1) return HEATMAP_COLORS[1];
  if (n === 2) return HEATMAP_COLORS[2];
  if (n === 3) return HEATMAP_COLORS[3];
  return HEATMAP_COLORS[4];
}

function ActivityHeatmap({ dailyActivity }) {
  const activityMap = Object.fromEntries((dailyActivity ?? []).map(d => [d.day, d.partidos]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Arrancar desde el lunes de hace 52 semanas
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  const dow = start.getDay();
  start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));

  const weeks = [];
  const cur = new Date(start);
  while (cur <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      const isFuture = cur > today;
      week.push({
        date: dateStr,
        n: isFuture ? -1 : (activityMap[dateStr] ?? 0),
        label: isFuture ? '' : cur.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' }),
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  // Etiquetas de mes (primer semana visible de cada mes)
  const monthLabels = [];
  weeks.forEach((week, wi) => {
    const d = new Date(week[0].date);
    if (d.getDate() <= 7 && (!monthLabels.length || monthLabels[monthLabels.length - 1].wi !== wi - 1)) {
      monthLabels.push({ wi, label: d.toLocaleDateString('es-AR', { month: 'short' }) });
    }
  });

  const CELL = 11;
  const GAP  = 2;
  const STEP = CELL + GAP;
  const DAY_LABELS = ['Lun', '', 'Mié', '', 'Vie', '', ''];

  return (
    <div>
      <div className="text-[10px] font-mono tracking-[2px] text-muted mb-3">ACTIVIDAD (ÚLTIMOS 12 MESES)</div>
      <div className="overflow-x-auto pb-2">
        <div style={{ display: 'inline-flex', flexDirection: 'column', minWidth: 'max-content' }}>
          {/* Etiquetas de mes */}
          <div style={{ display: 'flex', marginLeft: 28, marginBottom: 3 }}>
            {weeks.map((_, wi) => {
              const lbl = monthLabels.find(m => m.wi === wi);
              return (
                <div key={wi} style={{ width: STEP, flexShrink: 0, fontSize: 9, color: '#555', fontFamily: 'monospace' }}>
                  {lbl?.label ?? ''}
                </div>
              );
            })}
          </div>
          {/* Filas (días) */}
          {Array.from({ length: 7 }, (_, di) => (
            <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: GAP }}>
              <div style={{ width: 26, fontSize: 8, color: '#444', fontFamily: 'monospace', textAlign: 'right', paddingRight: 4, flexShrink: 0 }}>
                {DAY_LABELS[di]}
              </div>
              {weeks.map((week, wi) => {
                const cell = week[di];
                if (!cell) return <div key={wi} style={{ width: CELL, height: CELL, marginRight: GAP }} />;
                return (
                  <div
                    key={wi}
                    title={cell.n > 0 ? `${cell.label}: ${cell.n} ${cell.n === 1 ? 'partido' : 'partidos'}` : cell.label || ''}
                    style={{
                      width: CELL, height: CELL,
                      borderRadius: 2,
                      background: cell.n < 0 ? 'transparent' : heatColor(cell.n),
                      marginRight: GAP,
                      flexShrink: 0,
                    }}
                  />
                );
              })}
            </div>
          ))}
          {/* Leyenda */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 6, marginLeft: 28 }}>
            <span style={{ fontSize: 9, color: '#444', fontFamily: 'monospace', marginRight: 2 }}>Menos</span>
            {HEATMAP_COLORS.map((bg, i) => (
              <div key={i} style={{ width: CELL, height: CELL, borderRadius: 2, background: bg, flexShrink: 0 }} />
            ))}
            <span style={{ fontSize: 9, color: '#444', fontFamily: 'monospace', marginLeft: 2 }}>Más</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Estadísticas avanzadas (premium) ─────────────────────────────────────────
export default function AdvancedStats({ stats, monthlyStats, dailyActivity }) {
  const gf   = stats.games_favor  ?? 0;
  const gc   = stats.games_contra ?? 0;
  const diff = gf - gc;

  // Rellenar meses faltantes en los últimos 12
  const filledMonths = (() => {
    const map = Object.fromEntries((monthlyStats ?? []).map(m => [m.month, m]));
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
      const row = map[key];
      result.push({
        month: label,
        partidos:  row?.partidos  ?? 0,
        victorias: row?.victorias ?? 0,
        winRate:   row?.partidos > 0 ? Math.round((row.victorias / row.partidos) * 100) : 0,
      });
    }
    return result;
  })();

  const activeMonths = filledMonths.filter(m => m.partidos > 0).length;
  const avgPerMonth  = activeMonths > 0 ? (stats.partidos / activeMonths).toFixed(1) : '—';

  const bestMonth = (() => {
    const active = (monthlyStats ?? []).filter(m => m.victorias > 0 || m.partidos > 0);
    if (!active.length) return null;
    const best = active.reduce((b, m) =>
      m.victorias > b.victorias || (m.victorias === b.victorias && m.partidos > b.partidos) ? m : b,
      active[0]
    );
    const [y, mo] = best.month.split('-');
    const label = new Date(parseInt(y), parseInt(mo) - 1, 1)
      .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    return { ...best, label: label.charAt(0).toUpperCase() + label.slice(1) };
  })();

  return (
    <div className="bg-surface border border-border-mid rounded-lg p-5 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Lock size={13} className="text-brand" />
        <span className="font-condensed font-bold text-sm tracking-[3px] text-brand">ESTADÍSTICAS AVANZADAS</span>
      </div>

      {/* Mejor racha + Mejor mes */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
          <div className="font-condensed font-black text-[32px] text-white leading-none">{stats.racha_max ?? 0}</div>
          <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>MEJOR RACHA</div>
          <div className="text-[10px] font-mono mt-0.5" style={{ color: '#555' }}>
            {(stats.racha_max ?? 0) === 1 ? 'victoria consecutiva' : 'victorias consecutivas'}
          </div>
          <div className="h-0.5 rounded-full mt-2 bg-brand opacity-35" />
        </div>
        <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
          {bestMonth ? (
            <>
              <div className="font-condensed font-black text-[22px] text-white leading-none">{bestMonth.partidos}PJ · {bestMonth.victorias}V</div>
              <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>MEJOR MES</div>
              <div className="text-[10px] font-mono mt-0.5 truncate" style={{ color: '#555' }}>{bestMonth.label}</div>
            </>
          ) : (
            <>
              <div className="font-condensed font-black text-[32px] text-[#333] leading-none">—</div>
              <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>MEJOR MES</div>
            </>
          )}
          <div className="h-0.5 rounded-full mt-2 opacity-35" style={{ background: '#a84af0' }} />
        </div>
      </div>

      {/* Games GF / GC / DIF */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
          <div className="font-condensed font-black text-[28px] text-white leading-none">{gf}</div>
          <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>GAMES A FAVOR</div>
          <div className="h-0.5 rounded-full mt-2 bg-green opacity-40" />
        </div>
        <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
          <div className="font-condensed font-black text-[28px] text-white leading-none">{gc}</div>
          <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>GAMES EN CONTRA</div>
          <div className="h-0.5 rounded-full mt-2 bg-danger opacity-40" />
        </div>
        <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
          <div className={`font-condensed font-black text-[28px] leading-none ${diff > 0 ? 'text-green' : diff < 0 ? 'text-danger' : 'text-white'}`}>
            {diff > 0 ? '+' : ''}{diff}
          </div>
          <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>DIFERENCIA</div>
          <div className="h-0.5 rounded-full mt-2 opacity-40" style={{ background: diff >= 0 ? '#4af07a' : '#f07a4a' }} />
        </div>
      </div>

      {/* Meses activos + Promedio */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
          <div className="font-condensed font-black text-[28px] text-white leading-none">{activeMonths}</div>
          <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>MESES ACTIVOS</div>
          <div className="text-[10px] font-mono mt-0.5" style={{ color: '#555' }}>últimos 12 meses</div>
        </div>
        <div className="bg-base rounded-lg px-4 py-3 border border-border-strong">
          <div className="font-condensed font-black text-[28px] text-white leading-none">{avgPerMonth}</div>
          <div className="text-[10px] font-mono mt-1.5 tracking-widest" style={{ color: '#444' }}>PROM. PARTIDOS/MES</div>
          <div className="text-[10px] font-mono mt-0.5" style={{ color: '#555' }}>en meses activos</div>
        </div>
      </div>

      {/* Gráfico de barras — partidos + victorias por mes */}
      <div className="mb-6">
        <div className="text-[10px] font-mono tracking-[2px] text-muted mb-3">PARTIDOS POR MES</div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={filledMonths} margin={{ top: 0, right: 0, left: -28, bottom: 0 }} barSize={10} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#444', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff06' }} />
            <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace', color: '#555', paddingTop: 4 }} />
            <Bar dataKey="partidos" name="Partidos" fill="#4ab8f0" radius={[3, 3, 0, 0]} />
            <Bar dataKey="victorias" name="Victorias" fill="#4af07a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de líneas — win rate por mes */}
      <div className="mb-6">
        <div className="text-[10px] font-mono tracking-[2px] text-muted mb-3">WIN RATE % POR MES</div>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={filledMonths} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#444', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#ffffff15' }} />
            <Line
              type="monotone"
              dataKey="winRate"
              name="Win Rate"
              unit="%"
              stroke="#e8f04a"
              strokeWidth={2}
              dot={{ fill: '#e8f04a', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap de actividad */}
      <ActivityHeatmap dailyActivity={dailyActivity} />
    </div>
  );
}

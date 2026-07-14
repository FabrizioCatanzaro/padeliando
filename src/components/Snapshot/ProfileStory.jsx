import StoryFrame, { StatTile } from './StoryFrame';
import { C, fonts } from './story-theme';
import PlayerAvatar from '../shared/PlayerAvatar';

function calcNivel(partidos, pct) {
  if (partidos < 5) return null;
  if (pct >= 65) return { label: 'MAESTRO', color: '#f0d04a' };
  if (pct >= 50) return { label: 'AVANZADO', color: C.green };
  if (pct >= 35) return { label: 'INTERMEDIO', color: '#4ab8f0' };
  return { label: 'AMATEUR', color: C.secondary };
}

// Historia del perfil de un usuario.
export default function ProfileStory({ owner, stats = {}, avatar }) {
  const partidos  = stats.partidos ?? 0;
  const victorias = stats.victorias ?? 0;
  const torneos   = stats.torneos ?? 0;
  const racha     = stats.racha ?? 0;
  const pct       = partidos > 0 ? Math.round((victorias / partidos) * 100) : 0;
  const pctColor  = pct >= 60 ? C.green : pct >= 40 ? C.brand : '#f07a4a';
  const nivel     = calcNivel(partidos, pct);

  return (
    <StoryFrame eyebrow="PERFIL DE JUGADOR" title="">
      {/* Cabecera del jugador */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: -20 }}>
        <PlayerAvatar name={owner.name} src={avatar ?? owner.avatar_url} size={240} premium={!!owner.is_premium} />
        <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 60, color: C.white, marginTop: 34, lineHeight: 1.05 }}>
          {owner.name}
        </div>
        <div style={{ fontSize: 30, color: C.secondary, marginTop: 12 }}>@{owner.username}</div>
        {nivel && (
          <div style={{
            marginTop: 22, padding: '10px 26px', borderRadius: 999,
            border: `1px solid ${nivel.color}66`, background: `${nivel.color}18`,
            color: nivel.color, fontSize: 24, letterSpacing: 4, fontWeight: 700,
          }}>
            {nivel.label}
          </div>
        )}
      </div>

      {/* Stats principales */}
      <div style={{ display: 'flex', gap: 22, marginTop: 64 }}>
        <StatTile value={torneos}   label="TORNEOS"  accent={C.cyan} />
        <StatTile value={partidos}  label="PARTIDOS" accent={C.green} />
        <StatTile value={racha}     label="RACHA"    accent={racha > 0 ? C.brand : C.faint} sub={racha === 1 ? 'victoria' : 'victorias'} />
      </div>

      {/* Barra de win rate */}
      {partidos > 0 && (
        <div style={{
          marginTop: 24, background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 20, padding: '32px 34px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
            <span style={{ fontSize: 24, letterSpacing: 3, color: C.muted, fontWeight: 600 }}>% VICTORIAS</span>
            <span style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 52, color: pctColor, lineHeight: 1 }}>{pct}%</span>
          </div>
          <div style={{ height: 18, borderRadius: 999, background: '#111', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pctColor, borderRadius: 999 }} />
          </div>
          <div style={{ fontSize: 24, color: C.dim, marginTop: 16 }}>
            {victorias} {victorias === 1 ? 'victoria' : 'victorias'} en {partidos} partidos
          </div>
        </div>
      )}
    </StoryFrame>
  );
}

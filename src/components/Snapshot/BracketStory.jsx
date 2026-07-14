import StoryFrame from './StoryFrame';
import { C, fonts } from './story-theme';
import { PairAvatar } from '../shared/PlayerAvatar';

const PHASE_LABEL = { octavos: 'OCTAVOS', cuartos: 'CUARTOS', semis: 'SEMIS', final: 'FINAL' };

function firstName(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/)[0];
}

function pairPlayers(pairId, tournament) {
  const pair = tournament?.pairs?.find((p) => p.id === pairId);
  if (!pair) return null;
  const p1 = tournament.players?.find((pl) => pl.id === pair.p1);
  const p2 = tournament.players?.find((pl) => pl.id === pair.p2);
  return { p1, p2 };
}

function pairAvatar(pairId, tournament, size) {
  const pp = pairPlayers(pairId, tournament);
  if (!pp) return <PairAvatar name1="?" name2="?" size={size} />;
  return (
    <PairAvatar
      name1={pp.p1?.name ?? '?'} name2={pp.p2?.name ?? '?'}
      src1={pp.p1?.linked_avatar_url ?? null} src2={pp.p2?.linked_avatar_url ?? null}
      size={size}
    />
  );
}

// Celda de pareja para el cuadro: fotos + nombres (solo nombres de pila para
// que entren en el formato vertical 9:16).
function PairCell({ pairId, tournament, size, nameFs }) {
  const pp = pairPlayers(pairId, tournament);
  const label = pp
    ? `${firstName(pp.p1?.name)} / ${firstName(pp.p2?.name)}`
    : '? / ?';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: Math.round(size * 0.14), minWidth: 0,
    }}>
      {pairAvatar(pairId, tournament, size)}
      <div style={{
        fontFamily: fonts.sans, fontWeight: 600, fontSize: nameFs,
        color: C.soft, lineHeight: 1.15, textAlign: 'center',
        maxWidth: size * 2.6, overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
    </div>
  );
}

// Historia del cuadro eliminatorio, reorganizado verticalmente con las fotos de
// los jugadores y los nombres de pila de cada pareja para el formato 9:16.
export default function BracketStory({ tournament }) {
  const b = tournament.bracket ?? {};

  const rounds = [
    { key: 'octavos', matches: b.octavos ?? [] },
    { key: 'cuartos', matches: b.cuartos ?? [] },
    { key: 'semis',   matches: b.semis   ?? [] },
    { key: 'final',   matches: b.final ? [b.final] : [] },
  ]
    .map((r) => ({ ...r, matches: r.matches.filter((m) => m.pair1_id && m.pair2_id) }))
    .filter((r) => r.matches.length > 0);

  const totalMatches = rounds.reduce((n, r) => n + r.matches.length, 0);
  // Con octavos presentes puede haber hasta 15 cruces: se compacta para que la
  // final (abajo del todo) nunca se recorte dentro de los 1920px.
  const compact = totalMatches > 8;
  const AV        = compact ? 40 : 58;
  const nameFs    = compact ? 15 : 20;
  const rowPad    = compact ? '10px 20px' : '18px 26px';
  const scoreFs   = compact ? 34 : 48;
  const gap       = compact ? 8 : 14;
  const roundGap  = compact ? 16 : 28;
  const phaseMb   = compact ? 10 : 14;

  const finalWinnerName = b.final?.winner_name;

  return (
    <StoryFrame
      eyebrow="CUADRO ELIMINATORIO"
      title={tournament.name}
      accent={C.brand}
    >
      {finalWinnerName && (
        <div style={{
          background: `linear-gradient(180deg, ${C.amber}1f, ${C.amber}08)`,
          border: `1px solid ${C.amber}55`, borderRadius: 22,
          padding: '24px 30px', marginBottom: 26,
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <div style={{ fontSize: 50, lineHeight: 1 }}>🏆</div>
          {b.final?.winner_id && pairAvatar(b.final.winner_id, tournament, 58)}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 20, letterSpacing: 5, color: C.amber, fontWeight: 700, marginBottom: 6 }}>CAMPEONES</div>
            <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 34, color: C.white, lineHeight: 1.1 }}>
              {finalWinnerName}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: roundGap }}>
        {rounds.map((round) => (
          <div key={round.key}>
            <div style={{
              fontSize: 22, letterSpacing: 5, color: C.brand, fontWeight: 700,
              textAlign: 'center', marginBottom: phaseMb,
            }}>
              {PHASE_LABEL[round.key]}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap }}>
              {round.matches.map((m) => {
                const win1 = m.winner_id != null && m.winner_id === m.pair1_id;
                const win2 = m.winner_id != null && m.winner_id === m.pair2_id;
                const played = m.winner_id != null;
                return (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 18,
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 16, padding: rowPad,
                  }}>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', opacity: played && !win1 ? 0.45 : 1 }}>
                      <PairCell pairId={m.pair1_id} tournament={tournament} size={AV} nameFs={nameFs} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                      <span style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: scoreFs, color: win1 ? C.brand : C.secondary, lineHeight: 1 }}>
                        {played ? m.score1 : '–'}
                      </span>
                      <span style={{ fontSize: 26, color: C.faint }}>:</span>
                      <span style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: scoreFs, color: win2 ? C.cyan : C.secondary, lineHeight: 1 }}>
                        {played ? m.score2 : '–'}
                      </span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', opacity: played && !win2 ? 0.45 : 1 }}>
                      <PairCell pairId={m.pair2_id} tournament={tournament} size={AV} nameFs={nameFs} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </StoryFrame>
  );
}

import { useState, useEffect } from 'react';
import S, { FONTS } from '../../styles/theme';
import { api } from '../../utils/api';
import { fmt } from '../../utils/helpers';
import Loader from '../Loader/Loader';

export default function ProfileView({ username }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.groups.byUsername(username)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <Loader />;
  if (error)   return <div style={{ color: '#f04a4a', padding: 40 }}>{error}</div>;

  const { owner, groups } = data;
  //console.log(data);
  

  return (
    <div style={S.page}>
      <style>{FONTS}</style>
      <div style={S.header}>
        <div style={{ ...S.logo, cursor: 'pointer' }}
          onClick={() => { window.location.hash = '/'; }}>
          🎾 PADEL<span style={{ color: '#e8f04a' }}>EANDO</span>
        </div>
      </div>

      <div style={S.content}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
                        fontSize: 28, color: '#fff' }}>
            {owner.name}
          </div>
          <div style={{ fontSize: 12, color: '#555', fontFamily: "'Courier New',monospace", marginTop: 4 }}>
            @{owner.username} · desde {fmt(owner.created_at)}
          </div>
          {console.log(api)}
        </div>

        <div style={S.sectionTitle}>TORNEOS</div>

        {groups.length === 0 && (
          <div style={S.empty}>Este usuario no tiene torneos públicos.</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {groups.map((g) => (
            <div key={g.id} style={{ ...S.groupCard, cursor: 'pointer' }}
              onClick={() => { window.location.hash = `/groups/${g.id}`; }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
                            fontSize: 18, color: '#fff', marginBottom: 4 }}>
                {g.name}
              </div>
              {g.description && (
                <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{g.description}</div>
              )}
              <div style={{ fontSize: 11, color: '#444', fontFamily: "'Courier New',monospace" }}>
                {g.player_count} jugadores · {g.tournament_count} jornadas
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
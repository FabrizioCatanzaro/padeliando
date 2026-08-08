import { useNavigate } from 'react-router-dom';
import ClubLogo from '../shared/ClubLogo';
import { buildClubRows } from '../../utils/clubRows';

export default function GroupClubs({ tournaments = [], loading = false }) {
  const navigate = useNavigate();
  const rows = buildClubRows(tournaments);

  if (loading) {
    return <div className="text-muted text-sm font-mono">Cargando...</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-border-strong rounded-lg p-8 text-center">
        <p className="text-muted text-sm font-sans mb-1">Todavía no hay canchas registradas.</p>
        <p className="text-dim text-[12px] font-mono">
          Cuando asignes un club a un torneo, va a aparecer acá con cuántas veces jugaron ahí.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((c) => (
        <div
          key={c.id}
          onClick={() => navigate(`/club/${c.id}`)}
          className="flex items-center gap-3 bg-surface border border-border-mid rounded-md px-3.5 py-2.5 cursor-pointer hover:border-border-strong transition-colors"
        >
          <ClubLogo name={c.name} src={c.photo_url} size={28} />
          <div className="flex-1 min-w-0 truncate text-content text-[14px]">{c.name}</div>
          <div className="shrink-0 font-mono text-soft text-[13px]">
            {c.jornadas} {c.jornadas === 1 ? 'torneo' : 'torneos'} · {c.partidos}P
          </div>
        </div>
      ))}
    </div>
  );
}

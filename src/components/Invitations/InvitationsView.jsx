import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { fmt } from '../../utils/helpers';
import { CheckCircle, XCircle } from 'lucide-react';
import Loader from '../Loader/Loader';

export default function InvitationsView() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [processing, setProcessing]   = useState(null);

  useEffect(() => {
    api.invitations.list()
      .then(setInvitations)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function respond(id, action) {
    setProcessing(id);
    try {
      await api.invitations.respond(id, action);
      setInvitations(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="bg-base text-content font-sans pb-15">
      <div className="p-6">
        <div className="font-condensed font-bold text-[22px] text-white mb-1">Invitaciones</div>
        <div className="text-[12px] text-muted font-mono mb-6">
          Cuando alguien te invita a un torneo como jugador, aparece aquí. Al aceptar, tus estadísticas en ese grupo se vinculan a tu cuenta.
        </div>

        {loading && (
          <Loader />
        )}

        {error && (
          <div className="text-danger text-sm font-mono">{error}</div>
        )}

        {!loading && invitations.length === 0 && (
          <div className="text-center text-dim py-14 px-5 font-sans leading-loose">
            No tenés invitaciones pendientes.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {invitations.map(inv => (
            <div key={inv.id} className="bg-surface border border-border-mid rounded-lg p-4">
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div>
                  <div className="text-white font-sans mb-0.5">
                    Te invitaron como <span className="text-brand font-bold">{inv.player_name}</span>
                  </div>
                  <div className="text-[12px] text-muted font-mono">
                    Grupo: <span className="text-content">{inv.group_name}</span>
                  </div>
                  <div className="text-[11px] text-dim font-mono mt-1">
                    Enviada por @{inv.invited_by_username} · {fmt(inv.created_at)}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => respond(inv.id, 'accept')}
                    disabled={processing === inv.id}
                    className="flex items-center gap-1.5 bg-[#1a2e1a] border border-[#4af07a44] text-green px-4 py-2 text-[12px] font-condensed font-bold tracking-wide rounded-sm cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle size={13} /> Aceptar
                  </button>
                  <button
                    onClick={() => respond(inv.id, 'reject')}
                    disabled={processing === inv.id}
                    className="flex items-center gap-1.5 bg-transparent border border-border-strong text-muted px-4 py-2 text-[12px] font-condensed font-bold tracking-wide rounded-sm cursor-pointer disabled:opacity-50 hover:text-danger hover:border-danger/40 transition-colors"
                  >
                    <XCircle size={13} /> Rechazar
                  </button>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-dim font-mono border-t border-border-mid pt-2">
                Al aceptar, todas las estadísticas de <span className="text-content">{inv.player_name}</span> en ese grupo quedarán vinculadas a tu cuenta.
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

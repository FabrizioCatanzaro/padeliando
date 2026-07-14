import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/useAuth';
import { useToast } from '../../context/useToast';
import Btn from '../shared/Btn';
import Loader from '../Loader/Loader';
import { Users, ArrowLeftRight, ChevronLeft } from 'lucide-react';

export default function InviteAccept() {
  const { token } = useParams();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [info, setInfo]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [busy, setBusy]       = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { setLoading(false); return; }
    let alive = true;
    api.invites.resolve(token)
      .then((data) => { if (alive) setInfo(data); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [token, isLoggedIn, authLoading]);

  async function accept() {
    setBusy(true);
    try {
      const res = await api.invites.accept(token);
      showToast(res.kind === 'transfer' ? '¡Ahora sos el dueño!' : '¡Ya sos co-organizador!');
      navigate(`/cat/${res.group_id}`);
    } catch (e) {
      showToast(e.message, 'error');
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || loading) return <Loader />;

  const Frame = ({ children }) => (
    <div className="bg-base text-content font-sans flex flex-col items-center justify-center gap-4 px-6 py-12 text-center max-w-md mx-auto min-h-[50vh]">
      {children}
    </div>
  );

  if (!isLoggedIn) {
    return (
      <Frame>
        <div className="font-condensed font-bold text-2xl text-white tracking-wide">Iniciá sesión</div>
        <div className="text-muted text-sm">Necesitás una cuenta para aceptar esta invitación.</div>
        <Link to="/login"><Btn variant="primary" size="md">Iniciar sesión</Btn></Link>
      </Frame>
    );
  }

  if (error || !info) {
    return (
      <Frame>
        <div className="font-condensed font-bold text-2xl text-white tracking-wide">Invitación no válida</div>
        <div className="text-muted text-sm">{error ?? 'Esta invitación no existe o ya fue utilizada.'}</div>
        <Btn size="sm" icon={ChevronLeft} onClick={() => navigate('/')}>Volver al inicio</Btn>
      </Frame>
    );
  }

  const isTransfer = info.kind === 'transfer';
  const Icon = isTransfer ? ArrowLeftRight : Users;

  return (
    <Frame>
      <div className="w-14 h-14 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center">
        <Icon size={26} className="text-brand" />
      </div>
      <div className="max-w-sm">
        <div className="font-condensed font-bold text-2xl text-white tracking-wide mb-1">
          {isTransfer ? 'Transferencia de propiedad' : 'Invitación a co-organizar'}
        </div>
        <div className="text-secondary text-sm leading-relaxed">
          <span className="text-white font-semibold">@{info.from?.username ?? info.from?.name ?? 'Alguien'}</span>
          {isTransfer
            ? <> quiere transferirte la propiedad de <span className="text-brand font-semibold">{info.group?.name}</span>.</>
            : <> te invitó a co-organizar <span className="text-brand font-semibold">{info.group?.name}</span>.</>}
        </div>
      </div>

      {isTransfer && (
        <div className="bg-danger/10 border border-danger/40 rounded px-3 py-2.5 max-w-sm">
          <p className="text-danger text-[13px] leading-relaxed">
            <strong>Esta acción es irreversible.</strong> Vas a ser el nuevo dueño y tendrás el control total de la categoría y sus torneos.
          </p>
        </div>
      )}

      <div className="flex gap-2 mt-1">
        <Btn variant="primary" size="md" icon={Icon} loading={busy} onClick={accept}>
          {isTransfer ? 'Aceptar la propiedad' : 'Aceptar'}
        </Btn>
        <Btn size="md" onClick={() => navigate('/')}>No, gracias</Btn>
      </div>
    </Frame>
  );
}

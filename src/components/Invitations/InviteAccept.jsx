import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/useAuth';
import { useToast } from '../../context/useToast';
import Btn from '../shared/Btn';
import Loader from '../Loader/Loader';
import { Users, ArrowLeftRight, ChevronLeft, UserCheck, CheckCheck } from 'lucide-react';

export default function InviteAccept() {
  const { token } = useParams();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [info, setInfo]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [used,  setUsed]      = useState(null);   // { groupName } | null
  const [busy, setBusy]       = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { setLoading(false); return; }
    let alive = true;
    api.invites.resolve(token)
      .then((data) => { if (alive) setInfo(data); })
      .catch((e) => {
        if (!alive) return;
        // 410: el link existió pero ya lo usaron. Es lo que pasa cuando se
        // comparte en un grupo y alguien llega segundo.
        if (e.status === 410) setUsed({ groupName: e.data?.group_name ?? null });
        else setError(e.message);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [token, isLoggedIn, authLoading]);

  async function accept() {
    setBusy(true);
    try {
      const res = await api.invites.accept(token);
      showToast(
        res.kind === 'transfer' ? '¡Ahora sos el dueño!'
        : res.kind === 'player' ? '¡Listo! Ya estás vinculado.'
        : '¡Ya sos co-organizador!'
      );
      navigate(`/cat/${res.group_id}`);
    } catch (e) {
      // Perdió la carrera: alguien aceptó entre que se abrió la pantalla y el
      // clic. Es el mismo desenlace que un link ya usado, así que se muestra
      // igual en vez de un error suelto.
      if (e.status === 409 && e.message.includes('ya usó este link')) {
        setUsed({ groupName: info?.group?.name ?? null });
      } else {
        showToast(e.message, 'error');
        setError(e.message);
      }
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
    // Los links de jugador se mandan justamente a gente sin cuenta, así que
    // crear una tiene que ser tan visible como iniciar sesión. El `redirect`
    // los devuelve acá con la sesión abierta, sin tener que buscar el link otra vez.
    const volver = `?redirect=${encodeURIComponent(`/invitacion/${token}`)}`;
    return (
      <Frame>
        <div className="font-condensed font-bold text-2xl text-white tracking-wide">Te invitaron a Padeleando</div>
        <div className="text-muted text-sm">
          Necesitás una cuenta para aceptar la invitación. Es gratis y son unos segundos.
        </div>
        <div className="flex gap-2 mt-1">
          <Link to={`/register${volver}`}><Btn variant="primary" size="md">Crear cuenta</Btn></Link>
          <Link to={`/login${volver}`}><Btn size="md">Ya tengo cuenta</Btn></Link>
        </div>
      </Frame>
    );
  }

  if (used) {
    return (
      <Frame>
        <div className="w-14 h-14 rounded-full bg-surface border border-border-strong flex items-center justify-center">
          <CheckCheck size={26} className="text-muted" />
        </div>
        <div className="font-condensed font-bold text-2xl text-white tracking-wide">
          Este link ya fue usado
        </div>
        <div className="text-secondary text-sm leading-relaxed max-w-sm">
          Cada link de invitación sirve una sola vez y alguien ya lo aceptó
          {used.groupName ? <> en <span className="text-brand font-semibold">{used.groupName}</span></> : null}.
          {' '}Si tenías que ser vos, pedile al organizador que te genere uno nuevo.
        </div>
        <Btn size="sm" icon={ChevronLeft} onClick={() => navigate('/')}>Volver al inicio</Btn>
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
  const isPlayer   = info.kind === 'player';
  const Icon = isTransfer ? ArrowLeftRight : isPlayer ? UserCheck : Users;

  return (
    <Frame>
      <div className="w-14 h-14 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center">
        <Icon size={26} className="text-brand" />
      </div>
      <div className="max-w-sm">
        <div className="font-condensed font-bold text-2xl text-white tracking-wide mb-1">
          {isTransfer ? 'Transferencia de propiedad'
            : isPlayer ? 'Invitación a jugar'
            : 'Invitación a co-organizar'}
        </div>
        <div className="text-secondary text-sm leading-relaxed">
          <span className="text-white font-semibold">@{info.from?.username ?? info.from?.name ?? 'Alguien'}</span>
          {isTransfer
            ? <> quiere transferirte la propiedad de <span className="text-brand font-semibold">{info.group?.name}</span>.</>
            : isPlayer
              ? <> te invitó a jugar en <span className="text-brand font-semibold">{info.group?.name}</span> como <span className="text-brand font-semibold">{info.player?.name}</span>.</>
              : <> te invitó a co-organizar <span className="text-brand font-semibold">{info.group?.name}</span>.</>}
        </div>
      </div>

      {isPlayer && (
        <p className="text-dim text-[13px] leading-relaxed max-w-sm">
          Al aceptar, los partidos de {info.player?.name} en esa categoría pasan a contar en tu perfil.
        </p>
      )}

      {isTransfer && (
        <div className="bg-danger/10 border border-danger/40 rounded px-3 py-2.5 max-w-sm">
          <p className="text-danger text-[13px] leading-relaxed">
            <strong>Esta acción es irreversible.</strong> Vas a ser el nuevo dueño y tendrás el control total de la categoría y sus torneos.
          </p>
        </div>
      )}

      <div className="flex gap-2 mt-1">
        <Btn variant="primary" size="md" icon={Icon} loading={busy} onClick={accept}>
          {isTransfer ? 'Aceptar la propiedad' : isPlayer ? 'Sí, soy yo' : 'Aceptar'}
        </Btn>
        <Btn size="md" onClick={() => navigate('/')}>No, gracias</Btn>
      </div>
    </Frame>
  );
}

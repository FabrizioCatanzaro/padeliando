import { User, Users } from 'lucide-react';
import { formatPrice } from '../../utils/signup';

/**
 * Precio de inscripción para las filas de metadata de las cabeceras. El icono
 * distingue por jugador (una persona) de por pareja (dos). Sin precio, o con la
 * inscripción cerrada, no renderiza nada.
 */
export default function SignupPricePill({ signup }) {
  if (!signup?.open || signup.price == null) return null;
  const isPair = signup.unit === 'pair';
  const Icon = isPair ? Users : User;

  return (
    <span
      title={`Inscripción: ${formatPrice(signup.price, signup.unit)}`}
      className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/30 rounded-full px-2.5 py-0.5 text-[11px] font-mono text-brand"
    >
      <Icon size={11} className="shrink-0" />
      {signup.price === 0 ? 'Gratis' : `$${Number(signup.price).toLocaleString('es-AR')}`}
      <span className="text-brand/60">{signup.price === 0 ? '' : isPair ? '/pareja' : '/jugador'}</span>
    </span>
  );
}

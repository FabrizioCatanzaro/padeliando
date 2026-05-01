import { useState } from 'react';
import { X, Check, Zap, Star, Gift, ChevronDown, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';

const FREE_FEATURES = [
  '2 categorías máximo',
  '2 torneos al mes',
  'Estadísticas básicas',
];

const PRO_FEATURES = [
  'Categorías ilimitadas',
  'Torneos ilimitados',
  'Estadísticas avanzadas',
  'Álbum de fotos',
  'Ícono premium en el perfil',
  'Soporte prioritario',
];

const COMPARISON = [
  { feature: 'Categorías',          free: '2 máx.',    pro: 'Ilimitadas' },
  { feature: 'Torneos',            free: '2/mes',    pro: 'Ilimitados' },
  { feature: 'Estadísticas',        free: 'Básicas',  pro: 'Avanzadas' },
  { feature: 'Álbum de fotos',      free: false,      pro: true },
  { feature: 'Ícono premium',       free: false,      pro: true },
  { feature: 'Soporte',             free: 'Básico', pro: 'Prioritario' },
];

const FAQS = [
  {
    q: '¿Cómo funciona la prueba gratuita de 7 días?',
    a: 'Al suscribirte tendrás 7 días gratis sin cargo. Podés cancelar antes de que finalice sin ningún costo.',
  },
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Sí, podés cancelar tu suscripción cuando quieras desde la sección "Suscripciones" dentro de tu cuenta de Mercado Pago.',
  },
  {
    q: '¿Qué pasa con mis datos si cancelo?',
    a: 'Tus datos y estadísticas se mantienen. Solo perdés acceso a las funciones premium hasta que te vuelvas a suscribir.',
  },
];

const ORIGINAL_PRICE = 7000;
const MONTHLY_PRICE  = 3500;
const ANNUAL_PRICE   = Math.round(MONTHLY_PRICE * 0.8);

export default function PremiumModal({ onClose }) {
  const [billing, setBilling] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const price = billing === 'monthly' ? MONTHLY_PRICE : ANNUAL_PRICE;

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.subscriptions.checkout(billing);
      window.location.href = data.init_point;
    } catch (e) {
      setError(e.message || 'Error al iniciar el pago. Intentá de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-start justify-center z-[1000] overflow-y-auto py-6 px-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border-strong rounded-2xl w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-white transition p-1 z-10"
        >
          <X size={20} />
        </button>

        {/* Hero */}
        <div className="text-center pt-10 pb-6 px-6">
          <h2 className="font-condensed font-bold text-3xl text-white tracking-wide mb-2">
            Unite al club Premium
          </h2>
          <p className="text-secondary text-sm">Llevá tus estadísticas a mano siempre</p>

          {/* Social proof */}
          <div className="inline-flex items-center gap-2 bg-surface-alt border border-border-strong rounded-full px-4 py-2 mt-5">
            <div className="flex -space-x-2">
              {['var(--color-cyan)', 'var(--color-brand)', 'var(--color-danger)'].map((c, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-surface"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <span className="text-xs text-soft">Sé parte de Padeleando</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={10} className="text-brand fill-brand" />
              ))}
            </div>
          </div>
        </div>

        {/* Free trial banner */}
        <div className="mx-6 mb-5 bg-brand/10 border border-brand/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <Gift size={18} className="text-brand flex-shrink-0" />
          <div>
            <p className="text-brand text-sm font-semibold">Probá PREMIUM gratis por 7 días</p>
            <p className="text-secondary text-xs mt-0.5">Sin compromiso. Cancelá cuando quieras.</p>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="mx-6 mb-6 flex items-center bg-surface-alt rounded-xl p-1 border border-border-strong">
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition cursor-pointer ${
              billing === 'monthly' ? 'bg-surface text-white shadow' : 'text-secondary'
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setBilling('annual')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
              billing === 'annual' ? 'bg-surface text-white shadow' : 'text-secondary'
            }`}
          >
            Anual
            <span className="bg-brand text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              -20%
            </span>
          </button>
        </div>

        <div className="px-6 flex flex-col gap-4 pb-6">
          {/* Free plan */}
          <div className="border border-border-strong rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-condensed font-bold text-lg text-white">Básico</span>
              <span className="bg-border-strong text-soft text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Actual
              </span>
            </div>
            <p className="text-secondary text-xs mb-4">Ideal para empezar</p>
            <p className="font-condensed font-bold text-3xl text-white mb-4">Gratis</p>
            <ul className="flex flex-col gap-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-secondary">
                  <Check size={14} className="text-green flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro plan */}
          <div className="relative border-2 border-brand rounded-xl p-5 bg-brand/5">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-brand text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                ⭐ MÁS POPULAR
              </span>
            </div>

            <div className="flex items-center gap-2 mb-1 mt-1">
              <Zap size={16} className="text-brand fill-brand" />
              <span className="font-condensed font-bold text-xl text-white">Cuenta Premium</span>
            </div>
            <p className="text-secondary text-xs mb-4">Llevá tus estadísticas a mano siempre</p>

            <div className="mb-4">
              {billing === 'monthly' && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-muted line-through font-mono">AR${ORIGINAL_PRICE.toLocaleString('es-AR')}</span>
                  <span className="bg-brand text-black text-[10px] font-bold px-2 py-0.5 rounded-full leading-none tracking-wide">
                    -50% INAUGURACIÓN
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-secondary text-xs">AR$</span>
                <span className="font-condensed font-bold text-4xl text-white">{price.toLocaleString('es-AR')}</span>
                <span className="text-secondary text-sm">/mes</span>
              </div>
            </div>

            <ul className="flex flex-col gap-2 mb-5">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-soft">
                  <Check size={14} className="text-brand flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand text-black font-condensed font-bold text-base tracking-wide py-3.5 rounded-xl hover:brightness-110 active:brightness-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
              )}
              {loading ? 'Redirigiendo a Mercado Pago...' : 'Empezá 7 días gratis'}
            </button>
            {error && (
              <p className="text-center text-[11px] text-danger mt-2">{error}</p>
            )}
            {!error && (
              <p className="text-center text-[11px] text-muted mt-2">
                Sin cargo por 7 días. Luego AR${price}/mes. Cancelá cuando quieras.
              </p>
            )}
          </div>
        </div>

        {/* Comparison table */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={12} className="text-brand" />
            <span className="text-[10px] font-mono tracking-widest text-dim uppercase">
              Comparación de planes
            </span>
          </div>
          <div className="border border-border-strong rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-surface-alt px-4 py-2.5 border-b border-border-strong">
              <span className="text-xs text-secondary font-semibold">Característica</span>
              <span className="text-xs text-secondary font-semibold text-center">Básico</span>
              <span className="text-xs text-brand font-semibold text-center">Premium</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 px-4 py-3 items-center ${
                  i < COMPARISON.length - 1 ? 'border-b border-border-strong/40' : ''
                }`}
              >
                <span className="text-xs text-secondary">{row.feature}</span>
                <div className="flex justify-center">
                  {row.free === false ? (
                    <X size={14} className="text-muted" />
                  ) : (
                    <span className="text-xs text-soft text-center">{row.free}</span>
                  )}
                </div>
                <div className="flex justify-center">
                  {row.pro === true ? (
                    <Check size={14} className="text-brand" />
                  ) : (
                    <span className="text-xs text-brand font-semibold text-center">{row.pro}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-mono tracking-widest text-dim uppercase">
              Preguntas frecuentes
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-border-strong rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left bg-transparent hover:bg-surface-alt transition"
                >
                  <span className="text-sm text-soft pr-4">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-muted flex-shrink-0 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 pt-3 text-xs text-secondary leading-relaxed border-t border-border-strong/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div className="px-6 pb-8">
          <p className="text-[11px] text-dim text-center leading-relaxed">
            La suscripción se renueva automáticamente al final de cada período. Podés cancelar en cualquier momento desde la sección "Suscripciones" dentro de tu cuenta de Mercado Pago. Al suscribirte aceptás nuestros{' '}
            <span className="text-brand/70 cursor-pointer hover:text-brand transition">Términos de Servicio</span>
            {' '}y{' '}
            <span className="text-brand/70 cursor-pointer hover:text-brand transition">Política de Privacidad</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

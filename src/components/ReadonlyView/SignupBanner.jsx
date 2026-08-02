import { Ticket } from 'lucide-react';
import { CONTACT_META, contactHref, formatPrice, hasSignupInfo } from '../../utils/signup';

// Público a propósito: sirve para que se anote gente sin cuenta.
export default function SignupBanner({ signup, tournamentName }) {
  if (!hasSignupInfo(signup)) return null;

  const price = formatPrice(signup.price, signup.unit);

  return (
    <div className="px-6 py-3 bg-brand/8 border-y border-brand/20 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 min-w-0">
        <Ticket size={15} className="text-brand shrink-0" />
        <span className="text-[12px] font-mono text-brand/80">
          {price ? <>Inscripción · <span className="text-brand font-bold">{price}</span></> : 'Inscripción abierta'}
        </span>
      </div>

      {signup.contacts.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {signup.contacts.map((c) => {
            const meta = CONTACT_META[c.type];
            const href = contactHref(c, tournamentName);
            if (!meta || !href) return null;
            const Icon = meta.icon;
            return (
              <a
                key={c.type}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded border border-brand text-brand hover:bg-brand hover:text-base transition-colors"
              >
                <Icon size={13} className="shrink-0" />
                {meta.label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

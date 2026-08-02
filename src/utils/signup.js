import { MessageCircle, Phone, Mail, Instagram } from 'lucide-react';

// Precio y contactos de inscripción. Los cuatro campos viven en la categoría y
// en la jornada: la jornada hereda el que tenga en null. Espejo de lib/signup.js
// del backend, que es el que manda.

export const CONTACT_META = {
  whatsapp:  { label: 'WhatsApp',  icon: MessageCircle, placeholder: '+54 9 11 1234-5678' },
  phone:     { label: 'Teléfono',  icon: Phone,         placeholder: '+54 11 4321-1234' },
  email:     { label: 'Mail',      icon: Mail,          placeholder: 'inscripciones@club.com' },
  instagram: { label: 'Instagram', icon: Instagram,     placeholder: '@tucuenta' },
};

export const CONTACT_TYPES = Object.keys(CONTACT_META);

export function resolveSignup(tournament, group) {
  const pick = (k) => (tournament?.[k] ?? group?.[k] ?? null);
  return {
    open:     pick('signup_open') ?? false,
    price:    pick('signup_price'),
    unit:     pick('signup_price_unit') ?? 'player',
    contacts: pick('signup_contacts') ?? [],
  };
}

export function formatPrice(price, unit) {
  if (price == null) return null;
  if (price === 0) return 'Gratis';
  return `$${Number(price).toLocaleString('es-AR')} por ${unit === 'pair' ? 'pareja' : 'jugador'}`;
}

const digits = (v) => String(v).replace(/\D/g, '');

// Link accionable de un contacto. El mensaje ya viene armado donde aplica.
export function contactHref(contact, tournamentName) {
  const value = String(contact?.value ?? '').trim();
  if (!value) return null;
  const msg = `Hola! Quiero inscribirme${tournamentName ? ` en ${tournamentName}` : ''}.`;
  switch (contact.type) {
    case 'whatsapp':  return `https://wa.me/${digits(value)}?text=${encodeURIComponent(msg)}`;
    case 'phone':     return `tel:${value.replace(/[^\d+]/g, '')}`;
    case 'email':     return `mailto:${value}?subject=${encodeURIComponent(msg)}`;
    case 'instagram': return `https://instagram.com/${value.replace(/^@/, '')}`;
    default:          return null;
  }
}

// Hay algo que mostrar: el interruptor está activo y hay precio o contactos.
export function hasSignupInfo(signup) {
  return !!signup?.open && (signup.price != null || (signup.contacts?.length ?? 0) > 0);
}

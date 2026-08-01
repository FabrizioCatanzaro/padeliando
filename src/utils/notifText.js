// Frase corta de una notificación, para el aviso flotante. El panel de la
// campana y /notifications siguen renderizando su versión rica con enlaces;
// esto es texto plano y tiene que entenderse solo.

const actor = (n) => (n.actor_username ? `@${n.actor_username}` : n.actor_name ?? 'Alguien');
const grupo = (n) => n.group_name ?? 'una categoría';

const BY_TYPE = {
  follow:             (n) => `${actor(n)} te empezó a seguir`,
  invitation:         (n) => `${actor(n)} te invitó a unirte a ${grupo(n)}${n.player_name ? ` como ${n.player_name}` : ''}`,
  join_request:       (n) => `${actor(n)} solicitó unirse a ${n.tournament_name ?? 'un torneo'}`,
  collab_invite:      (n) => `${actor(n)} te invitó a co-organizar ${grupo(n)}`,
  ownership_transfer: (n) => `${actor(n)} quiere transferirte ${grupo(n)}`,
  ownership_received: (n) => `Ahora sos el dueño de ${grupo(n)}`,
  player_unlinked:    (n) => `${actor(n)} te desvinculó de ${grupo(n)}`,
  new_tournament:     (n) => `${actor(n)} creó ${n.tournament_name ?? 'una jornada'} en ${grupo(n)}`,
  club_request:       ()  => 'Novedades sobre tu solicitud de club',
  premium_claim:      ()  => 'Tenés un código premium para reclamar',
  admin_message:      (n) => n.body ?? 'Mensaje del equipo',
};

const MAX = 120;
const clip = (s) => (s.length > MAX ? `${s.slice(0, MAX - 1).trimEnd()}…` : s);

export function notifTitle(n) {
  if (n?.type === 'admin_message') return n.title ?? 'Mensaje del equipo';
  return 'Notificación nueva';
}

export function notifSummary(n) {
  if (!n) return '';
  const fn = BY_TYPE[n.type];
  return clip(fn ? fn(n) : 'Tenés una notificación nueva');
}

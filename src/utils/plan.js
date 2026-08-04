// Cupos del plan Básico. Espejo de padeliando-api/src/lib/plan.js, que es quien
// los aplica de verdad: acá sólo evitan el viaje al servidor y arman el mensaje.
export const FREE_MAX_GROUPS            = 2;
export const FREE_TOURNAMENTS_PER_MONTH = 2;

// ¿El 403 que volvió del backend es un cupo lleno y no una falta de permiso?
export const isPlanLimit = (e) => e?.data?.code === 'plan_limit';

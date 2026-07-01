import ErrorApi from "./ErrorApi.js";

/**
 * Un admin general opera entre sedes libremente. Un usuario normal solo
 * puede accionar movimientos de su propia sede — así el permiso de rol
 * (ej. "entradas:actualizar") no le da acceso a datos de otras sedes.
 */
export const verificarAccesoSede = (usuarioActual, sedeRequerida, accion) => {
  if (!usuarioActual || usuarioActual.esAdmin) return;
  // sedeId puede llegar como id crudo o poblado ({_id, nombre}) según de
  // dónde venga usuarioActual (JWT vs. documento de Mongo).
  const miSede = usuarioActual.sedeId?._id || usuarioActual.sedeId;
  if (!miSede || String(miSede) !== String(sedeRequerida)) {
    throw new ErrorApi(403, `Solo tu sede puede ${accion}`);
  }
};

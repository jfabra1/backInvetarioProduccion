import ErrorApi from "../utils/ErrorApi.js";
import RolRepository from "../repositories/RolRepository.js";

/**
 * Factoría de hooks preHandler.
 * Verifica que el usuario autenticado tenga el permiso {modulo, accion}
 * en su rol asignado.
 *
 * REQUIERE: autenticar() ejecutado antes (request.usuario disponible).
 *
 * @param {string} modulo - Módulo del sistema (ver MODULOS en permisos.util.js)
 * @param {string} accion - Acción (ver, crear, actualizar, eliminar)
 */
export const verificarPermiso = (modulo, accion) => {
  return async (request, reply) => {
    if (!request.usuarioId) throw new ErrorApi(401, "No autenticado");

    const { rolId } = request.usuario;

    // "esAdmin" solo habilita operar entre sedes (ver soloAdmin más abajo
    // y las rutas que inyectan sedeUsuario). Los permisos por módulo/acción
    // siempre se determinan por el rol asignado, sin excepción.
    if (!rolId) {
      throw new ErrorApi(403, "No tienes un rol asignado");
    }

    const rol = await RolRepository.findById(rolId);

    if (!rol || !rol.activo) {
      throw new ErrorApi(403, "Tu rol no está activo");
    }

    const tienePermiso = rol.permisos.some(
      (p) => p.modulo === modulo && p.accion === accion,
    );

    if (!tienePermiso) {
      throw new ErrorApi(403, `No tienes permiso para ${accion} en ${modulo}`);
    }

    // Si es admin de sede, inyectar la sede para filtrar datos
    if (request.usuario.sedeId) {
      request.sedeUsuario = request.usuario.sedeId;
    }
  };
};

/**
 * Hook que restringe el acceso solo a administradores generales.
 */
export const soloAdmin = async (request, reply) => {
  if (!request.usuarioId) throw new ErrorApi(401, "No autenticado");
  if (!request.usuario.esAdmin) {
    throw new ErrorApi(403, "Acceso exclusivo de administrador");
  }
};

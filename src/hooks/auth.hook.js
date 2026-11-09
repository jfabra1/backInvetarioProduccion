import ErrorApi from "../utils/ErrorApi.js";
import Usuario from "../models/Usuario.js";

/**
 * Hook preHandler que verifica el JWT e inyecta request.usuarioId y request.usuario.
 *
 * sedeId, rolId, esAdmin y activo se leen de la BD en cada petición en vez
 * de confiar en los del token: si un admin cambia la sede o el rol de un
 * usuario (o lo desactiva), el cambio aplica de inmediato y no hasta que
 * expire el access token (antes el front mostraba la sede nueva y el back
 * seguía exigiendo la anterior: "Solo tu sede puede ...").
 */
export const autenticar = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (error) {
    throw new ErrorApi(401, "Token inválido o expirado");
  }

  const actual = await Usuario.findById(request.user.id)
    .select("sedeId rolId esAdmin activo debeCambiarContrasena")
    .lean();
  if (!actual || actual.activo === false) {
    throw new ErrorApi(401, "Usuario inactivo o inexistente");
  }

  // Con contraseña temporal solo se permiten las rutas de /auth (perfil,
  // cambiar contraseña, logout) hasta que la cambie.
  if (actual.debeCambiarContrasena === true && !request.url.startsWith("/api/v1/auth/")) {
    throw new ErrorApi(403, "Debes cambiar tu contraseña temporal antes de continuar");
  }

  request.usuarioId = request.user.id;
  request.usuario = {
    ...request.user,
    sedeId: actual.sedeId ? String(actual.sedeId) : null,
    rolId: actual.rolId ? String(actual.rolId) : null,
    esAdmin: actual.esAdmin === true,
  };
};

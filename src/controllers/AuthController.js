import AuthService from "../services/AuthService.js";
import RespuestaApi from "../utils/RespuestaApi.js";

class AuthController {
  async login(request, reply) {
    const { email, contrasena } = request.body;
    const { usuario, refreshToken } = await AuthService.login(
      email,
      contrasena,
    );

    // En el JWT solo va el ID (string) de la sede; el objeto poblado va en el body
    const sedeIdJwt = usuario.sedeId?._id ?? usuario.sedeId ?? null;

    const accessToken = await reply.jwtSign({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      esAdmin: usuario.esAdmin,
      rolId: usuario.rolId,
      sedeId: sedeIdJwt,
    });

    reply.setCookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return RespuestaApi.exito(reply, "Login exitoso", {
      accessToken,
      usuario,        // contiene sedeId poblado { _id, nombre }
    });
  }

  async renovarToken(request, reply) {
    const refreshTokenAnterior = request.cookies.refreshToken;
    const { usuario, refreshToken } =
      await AuthService.renovarToken(refreshTokenAnterior);

    const sedeIdJwt = usuario.sedeId?._id ?? usuario.sedeId ?? null;

    const accessToken = await reply.jwtSign({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      esAdmin: usuario.esAdmin,
      rolId: usuario.rolId,
      sedeId: sedeIdJwt,
    });

    reply.setCookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return RespuestaApi.exito(reply, "Token renovado", {
      accessToken,
      usuario,        // contiene sedeId poblado { _id, nombre }
    });
  }

  async logout(request, reply) {
    await AuthService.logout(request.usuarioId);

    reply.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return RespuestaApi.exito(reply, "Sesión cerrada exitosamente");
  }

  async cambiarContrasena(request, reply) {
    const { contrasenaActual, nuevaContrasena } = request.body;
    await AuthService.cambiarContrasena(
      request.usuarioId,
      contrasenaActual,
      nuevaContrasena,
    );
    return RespuestaApi.exito(reply, "Contraseña actualizada exitosamente");
  }

  async solicitarRecuperacion(request, reply) {
    const resultado = await AuthService.solicitarRecuperacion(
      request.body.email,
    );

    // TODO: enviar correo con el token de recuperación
    // if (resultado) { CorreoService.enviarRecuperacion(...) }

    return RespuestaApi.exito(
      reply,
      "Si el correo existe, recibirás instrucciones para recuperar tu contraseña",
    );
  }

  async restablecerContrasena(request, reply) {
    const { token } = request.params;
    const { nuevaContrasena } = request.body;
    await AuthService.restablecerContrasena(token, nuevaContrasena);
    return RespuestaApi.exito(reply, "Contraseña restablecida exitosamente");
  }

  async perfil(request, reply) {
    const usuario = await AuthService.obtenerPerfil(request.usuarioId);
    return RespuestaApi.exito(reply, "Perfil obtenido", { usuario });
  }
}

export default new AuthController();

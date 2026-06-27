import crypto from "crypto";
import bcrypt from "bcryptjs";
import UsuarioRepository from "../repositories/UsuarioRepository.js";
import RolRepository from "../repositories/RolRepository.js";
import RefreshTokenRepository from "../repositories/RefreshTokenRepository.js";
import ErrorApi from "../utils/ErrorApi.js";
import { logAccionUsuario, logError } from "../config/logger.js";
import { generarTodosLosPermisos } from "../utils/permisos.util.js";

class AuthService {
  async construirUsuarioSesion(usuario) {
    let permisos = [];

    if (usuario.esAdmin) {
      permisos = generarTodosLosPermisos();
    } else if (usuario.rolId) {
      const rol = await RolRepository.findById(usuario.rolId);
      if (rol?.activo && Array.isArray(rol.permisos)) {
        permisos = rol.permisos;
      }
    }

    // Normaliza sedeId: siempre devuelve { _id, nombre } o null
    const sedeRaw = usuario.sedeId;
    const sedeId = sedeRaw
      ? typeof sedeRaw === "object" && sedeRaw._id
        ? { _id: String(sedeRaw._id), nombre: sedeRaw.nombre || "" }
        : { _id: String(sedeRaw), nombre: "" }
      : null;

    return {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      esAdmin: usuario.esAdmin,
      rolId: usuario.rolId,
      sedeId,
      debeCambiarContrasena: usuario.debeCambiarContrasena,
      permisos,
    };
  }

  /**
   * Login — genera access token y refresh token.
   * El access token se firma en el controlador (necesita fastify.jwt).
   */
  async login(email, contrasena) {
    const usuario = await UsuarioRepository.findByEmail(email);
    if (!usuario) throw new ErrorApi(401, "Credenciales inválidas");

    const contrasenaValida = await bcrypt.compare(
      contrasena,
      usuario.passwordHash,
    );
    if (!contrasenaValida) throw new ErrorApi(401, "Credenciales inválidas");

    const refreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + 7);

    await RefreshTokenRepository.create({
      usuarioId: usuario._id,
      tokenHash: refreshTokenHash,
      expiraEn,
    });

    logAccionUsuario(usuario._id, "LOGIN", { email });

    const usuarioSesion = await this.construirUsuarioSesion(usuario);

    return {
      usuario: usuarioSesion,
      refreshToken,
    };
  }

  /**
   * Renovar token — valida refresh token y genera uno nuevo.
   */
  async renovarToken(refreshTokenAnterior) {
    if (!refreshTokenAnterior)
      throw new ErrorApi(401, "Refresh token no proporcionado");

    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshTokenAnterior)
      .digest("hex");
    const tokenEncontrado =
      await RefreshTokenRepository.findByTokenHash(tokenHash);

    if (!tokenEncontrado) throw new ErrorApi(401, "Refresh token inválido");
    if (tokenEncontrado.expiraEn < new Date()) {
      await RefreshTokenRepository.revocarPorTokenHash(tokenHash);
      throw new ErrorApi(401, "Refresh token expirado");
    }

    // Revocar el anterior
    await RefreshTokenRepository.revocarPorTokenHash(tokenHash);

    const usuario = await UsuarioRepository.findById(tokenEncontrado.usuarioId);
    if (!usuario || !usuario.activo)
      throw new ErrorApi(401, "Usuario no encontrado o inactivo");

    // Crear nuevo refresh token
    const nuevoRefreshToken = crypto.randomBytes(64).toString("hex");
    const nuevoTokenHash = crypto
      .createHash("sha256")
      .update(nuevoRefreshToken)
      .digest("hex");

    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + 7);

    await RefreshTokenRepository.create({
      usuarioId: usuario._id,
      tokenHash: nuevoTokenHash,
      expiraEn,
    });

    const usuarioSesion = await this.construirUsuarioSesion(usuario);

    return {
      usuario: usuarioSesion,
      refreshToken: nuevoRefreshToken,
    };
  }

  async obtenerPerfil(usuarioId) {
    const usuario = await UsuarioRepository.findById(usuarioId);
    if (!usuario || !usuario.activo) {
      throw new ErrorApi(401, "Usuario no encontrado o inactivo");
    }

    return await this.construirUsuarioSesion(usuario);
  }

  /**
   * Logout — revoca todos los refresh tokens del usuario.
   */
  async logout(usuarioId) {
    await RefreshTokenRepository.revocarPorUsuario(usuarioId);
    logAccionUsuario(usuarioId, "LOGOUT");
  }

  /**
   * Cambiar contraseña.
   */
  async cambiarContrasena(usuarioId, contrasenaActual, nuevaContrasena) {
    const usuario = await UsuarioRepository.findById(usuarioId);
    if (!usuario) throw new ErrorApi(404, "Usuario no encontrado");

    const contrasenaValida = await bcrypt.compare(
      contrasenaActual,
      usuario.passwordHash,
    );
    if (!contrasenaValida)
      throw new ErrorApi(400, "La contraseña actual es incorrecta");

    const nuevaHash = await bcrypt.hash(nuevaContrasena, 12);
    await UsuarioRepository.updateById(usuarioId, {
      passwordHash: nuevaHash,
      debeCambiarContrasena: false,
    });

    logAccionUsuario(usuarioId, "CAMBIAR_CONTRASENA");
  }

  /**
   * Solicitar recuperación de contraseña.
   */
  async solicitarRecuperacion(email) {
    const usuario = await UsuarioRepository.findByEmail(email);
    // No revelar si el email existe o no
    if (!usuario) return;

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await UsuarioRepository.updateById(usuario._id, {
      tokenRecuperacion: tokenHash,
      expiracionTokenRecuperacion: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
    });

    logAccionUsuario(usuario._id, "SOLICITAR_RECUPERACION_CONTRASENA");
    return { token, usuario };
  }

  /**
   * Restablecer contraseña con token.
   */
  async restablecerContrasena(token, nuevaContrasena) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const usuario = await UsuarioRepository.findByTokenRecuperacion(tokenHash);

    if (!usuario) throw new ErrorApi(400, "Token inválido o expirado");

    const nuevaHash = await bcrypt.hash(nuevaContrasena, 12);
    await UsuarioRepository.updateById(usuario._id, {
      passwordHash: nuevaHash,
      tokenRecuperacion: null,
      expiracionTokenRecuperacion: null,
      debeCambiarContrasena: false,
    });

    // Revocar todos los refresh tokens
    await RefreshTokenRepository.revocarPorUsuario(usuario._id);

    logAccionUsuario(usuario._id, "RESTABLECER_CONTRASENA");
  }
}

export default new AuthService();

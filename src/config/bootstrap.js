import bcrypt from "bcryptjs";
import Rol from "../models/Rol.js";
import Usuario from "../models/Usuario.js";
import { logger } from "./logger.js";
import { generarTodosLosPermisos } from "../utils/permisos.util.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sistema.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin1234*";
const ADMIN_NOMBRE = process.env.ADMIN_NOMBRE || "Administrador";

/**
 * Crea (o completa) el rol "Administrador" con todos los permisos del
 * sistema. Se ejecuta en CADA arranque, no solo cuando la base está vacía,
 * para que un módulo nuevo (ej. "ventas", "racks") no deje al rol
 * Administrador desactualizado — ya que los permisos de "esAdmin" ahora
 * dependen íntegramente de su rol, igual que cualquier otro usuario.
 */
const sincronizarRolAdministrador = async () => {
  let rolAdministrador = await Rol.findOne({ nombre: "Administrador" });
  const permisosCompletos = generarTodosLosPermisos();

  if (!rolAdministrador) {
    rolAdministrador = await Rol.create({
      nombre: "Administrador",
      descripcion: "Rol con todos los permisos del sistema",
      permisos: permisosCompletos,
      esPredeterminado: true,
      activo: true,
    });

    logger.info("Bootstrap: rol Administrador creado");
    return rolAdministrador;
  }

  const permisosActuales = new Set(
    rolAdministrador.permisos.map((p) => `${p.modulo}:${p.accion}`),
  );
  const faltantes = permisosCompletos.filter(
    (p) => !permisosActuales.has(`${p.modulo}:${p.accion}`),
  );

  if (faltantes.length > 0) {
    rolAdministrador.permisos = permisosCompletos;
    await rolAdministrador.save();
    logger.info(
      { permisosAgregados: faltantes },
      "Bootstrap: rol Administrador resincronizado con módulos nuevos",
    );
  }

  return rolAdministrador;
};

/**
 * Crea el primer usuario administrador al iniciar el sistema,
 * únicamente cuando no existe ningún usuario en la base de datos.
 */
export const inicializarPrimerUsuario = async () => {
  const rolAdministrador = await sincronizarRolAdministrador();

  const totalUsuarios = await Usuario.countDocuments({});
  if (totalUsuarios > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await Usuario.create({
    nombre: ADMIN_NOMBRE,
    email: ADMIN_EMAIL,
    passwordHash,
    rolId: rolAdministrador._id,
    esAdmin: true,
    debeCambiarContrasena: false,
    activo: true,
  });

  logger.warn(
    { email: ADMIN_EMAIL },
    "Bootstrap: se creo el primer usuario administrador. Cambia la contrasena despues del primer ingreso.",
  );
};

import UsuarioController from "../controllers/UsuarioController.js";
import { autenticar } from "../hooks/auth.hook.js";
import { soloAdmin, verificarPermiso } from "../hooks/permisos.hook.js";
import {
  schemaCrearUsuario,
  schemaListarUsuarios,
  schemaListarUsuariosPaginado,
  schemaObtenerUsuario,
  schemaActualizarUsuario,
  schemaEliminarUsuario,
  schemaActualizarEstadoUsuario,
  schemaEliminarUsuarioFisico,
} from "../docs/usuario.docs.js";

async function usuarioRoutes(fastify) {
  // soloAdmin: solo usuarios marcados como administrador pueden operar aquí
  // (limita quién puede siquiera intentarlo, entre sedes). verificarPermiso:
  // dentro de ese grupo, lo que realmente puede hacer depende de su rol.
  fastify.addHook("onRequest", autenticar);
  fastify.addHook("onRequest", soloAdmin);

  fastify.post(
    "/",
    { schema: schemaCrearUsuario, preHandler: verificarPermiso("usuarios", "crear") },
    (req, reply) => UsuarioController.crear(req, reply),
  );
  fastify.get(
    "/",
    { schema: schemaListarUsuarios, preHandler: verificarPermiso("usuarios", "ver") },
    (req, reply) => UsuarioController.listar(req, reply),
  );
  fastify.get(
    "/paginado",
    { schema: schemaListarUsuariosPaginado, preHandler: verificarPermiso("usuarios", "ver") },
    (req, reply) => UsuarioController.listarPaginado(req, reply),
  );
  fastify.get(
    "/:id",
    { schema: schemaObtenerUsuario, preHandler: verificarPermiso("usuarios", "ver") },
    (req, reply) => UsuarioController.obtenerPorId(req, reply),
  );
  fastify.put(
    "/:id",
    { schema: schemaActualizarUsuario, preHandler: verificarPermiso("usuarios", "actualizar") },
    (req, reply) => UsuarioController.actualizar(req, reply),
  );
  fastify.delete(
    "/:id",
    { schema: schemaEliminarUsuario, preHandler: verificarPermiso("usuarios", "estado") },
    (req, reply) => UsuarioController.eliminar(req, reply),
  );
  fastify.patch(
    "/:id/estado",
    { schema: schemaActualizarEstadoUsuario, preHandler: verificarPermiso("usuarios", "estado") },
    (req, reply) => UsuarioController.actualizarEstado(req, reply),
  );
  fastify.delete(
    "/:id/fisico",
    { schema: schemaEliminarUsuarioFisico, preHandler: verificarPermiso("usuarios", "eliminar") },
    (req, reply) => UsuarioController.eliminarFisico(req, reply),
  );
}

export default usuarioRoutes;

import RolController from "../controllers/RolController.js";
import { autenticar } from "../hooks/auth.hook.js";
import { soloAdmin, verificarPermiso } from "../hooks/permisos.hook.js";
import {
  schemaCrearRol,
  schemaListarRoles,
  schemaListarRolesPaginado,
  schemaObtenerRol,
  schemaActualizarRol,
  schemaEliminarRol,
  schemaReactivarRol,
  schemaEliminarRolFisico,
} from "../docs/rol.docs.js";

async function rolRoutes(fastify) {
  // soloAdmin: solo usuarios marcados como administrador pueden operar aquí
  // (limita quién puede siquiera intentarlo, entre sedes). verificarPermiso:
  // dentro de ese grupo, lo que realmente puede hacer depende de su rol.
  fastify.addHook("onRequest", autenticar);
  fastify.addHook("onRequest", soloAdmin);

  fastify.post(
    "/",
    { schema: schemaCrearRol, preHandler: verificarPermiso("roles", "crear") },
    (req, reply) => RolController.crear(req, reply),
  );
  fastify.get(
    "/",
    { schema: schemaListarRoles, preHandler: verificarPermiso("roles", "ver") },
    (req, reply) => RolController.listar(req, reply),
  );
  fastify.get(
    "/paginado",
    { schema: schemaListarRolesPaginado, preHandler: verificarPermiso("roles", "ver") },
    (req, reply) => RolController.listarPaginado(req, reply),
  );
  fastify.get(
    "/:id",
    { schema: schemaObtenerRol, preHandler: verificarPermiso("roles", "ver") },
    (req, reply) => RolController.obtenerPorId(req, reply),
  );
  fastify.put(
    "/:id",
    { schema: schemaActualizarRol, preHandler: verificarPermiso("roles", "actualizar") },
    (req, reply) => RolController.actualizar(req, reply),
  );
  fastify.delete(
    "/:id",
    { schema: schemaEliminarRol, preHandler: verificarPermiso("roles", "eliminar") },
    (req, reply) => RolController.eliminar(req, reply),
  );
  fastify.put(
    "/:id/reactivar",
    { schema: schemaReactivarRol, preHandler: verificarPermiso("roles", "actualizar") },
    (req, reply) => RolController.reactivar(req, reply),
  );
  fastify.delete(
    "/:id/fisico",
    { schema: schemaEliminarRolFisico, preHandler: verificarPermiso("roles", "eliminar") },
    (req, reply) => RolController.eliminarFisico(req, reply),
  );
}

export default rolRoutes;

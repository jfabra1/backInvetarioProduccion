import authRoutes from "./auth.routes.js";
import usuarioRoutes from "./usuario.routes.js";
import rolRoutes from "./rol.routes.js";
import sedeRoutes from "./sede.routes.js";
import categoriaRoutes from "./categoria.routes.js";
import grupoRoutes from "./grupo.routes.js";
import unidadMedidaRoutes from "./unidadMedida.routes.js";
import productoRoutes from "./producto.routes.js";
import terceroRoutes from "./tercero.routes.js";
import ordenCompraRoutes from "./ordenCompra.routes.js";
import entradaRoutes from "./entrada.routes.js";
import salidaRoutes from "./salida.routes.js";
import ventaRoutes from "./venta.routes.js";
import trasladoRoutes from "./traslado.routes.js";
import ajusteInventarioRoutes from "./ajusteInventario.routes.js";
import ordenDespachoRoutes from "./ordenDespacho.routes.js";
import inventarioRoutes from "./inventario.routes.js";
import importacionRoutes from "./importacion.routes.js";
import rackRoutes from "./rack.routes.js";

const rutasPrincipales = async (fastify, opciones) => {
  // ─── Rutas sin autenticación ─────────────────────────────
  await fastify.register(authRoutes, { prefix: "/v1/auth" });

  // ─── Rutas protegidas ────────────────────────────────────
  await fastify.register(usuarioRoutes, { prefix: "/v1/usuarios" });
  await fastify.register(rolRoutes, { prefix: "/v1/roles" });
  await fastify.register(sedeRoutes, { prefix: "/v1/sedes" });
  await fastify.register(categoriaRoutes, { prefix: "/v1/categorias" });
  await fastify.register(grupoRoutes, { prefix: "/v1/grupos" });
  await fastify.register(unidadMedidaRoutes, { prefix: "/v1/unidades-medida" });
  await fastify.register(productoRoutes, { prefix: "/v1/productos" });
  await fastify.register(terceroRoutes, { prefix: "/v1/terceros" });
  await fastify.register(ordenCompraRoutes, { prefix: "/v1/ordenes-compra" });
  await fastify.register(entradaRoutes, { prefix: "/v1/entradas" });
  await fastify.register(salidaRoutes, { prefix: "/v1/salidas" });
  await fastify.register(ventaRoutes, { prefix: "/v1/ventas" });
  await fastify.register(trasladoRoutes, { prefix: "/v1/traslados" });
  await fastify.register(ajusteInventarioRoutes, {
    prefix: "/v1/ajustes-inventario",
  });
  await fastify.register(ordenDespachoRoutes, {
    prefix: "/v1/ordenes-despacho",
  });
  await fastify.register(inventarioRoutes, { prefix: "/v1/inventario" });
  await fastify.register(importacionRoutes, { prefix: "/v1/importacion" });
  await fastify.register(rackRoutes, { prefix: "/v1/racks" });

  // Ruta de health check
  fastify.get("/health", async () => ({
    statusCode: 200,
    status: "success",
    message: "API Sistema de Inventario funcionando",
    timestamp: new Date().toISOString(),
  }));
};

export default rutasPrincipales;

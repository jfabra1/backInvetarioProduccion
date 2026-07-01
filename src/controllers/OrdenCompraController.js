import OrdenCompraService from "../services/OrdenCompraService.js";
import RespuestaApi from "../utils/RespuestaApi.js";

class OrdenCompraController {
  async crear(request, reply) {
    const orden = await OrdenCompraService.crearOrden(
      request.body,
      request.usuarioId,
      request.usuario,
    );
    return RespuestaApi.exito(reply, "Orden de compra creada", { orden }, 201);
  }

  async listar(request, reply) {
    const ordenesCompra = await OrdenCompraService.obtenerOrdenes();
    return RespuestaApi.exito(reply, "Órdenes de compra obtenidas", {
      ordenesCompra,
    });
  }

  async listarPaginado(request, reply) {
    const {
      pagina = 1,
      limite = 20,
      proveedorId,
      sedeId,
      estado,
    } = request.query;
    const filtros = {};
    if (proveedorId) filtros.proveedorId = proveedorId;
    if (sedeId) filtros.sedeId = sedeId;
    if (estado) filtros.estado = estado;

    const resultado = await OrdenCompraService.obtenerOrdenesPaginado(
      Number(pagina),
      Number(limite),
      filtros,
    );
    return RespuestaApi.exito(reply, "Órdenes de compra obtenidas", {
      ordenesCompra: resultado.documentos || [],
      paginacion: resultado.paginacion,
    });
  }

  async obtenerPorId(request, reply) {
    const orden = await OrdenCompraService.obtenerOrdenPorId(request.params.id);
    return RespuestaApi.exito(reply, "Orden obtenida", { orden });
  }

  async actualizar(request, reply) {
    const orden = await OrdenCompraService.actualizarOrden(
      request.params.id,
      request.body,
      request.usuarioId,
      request.usuario,
    );
    return RespuestaApi.exito(reply, "Orden actualizada", { orden });
  }

  async enviar(request, reply) {
    const orden = await OrdenCompraService.enviarOrden(
      request.params.id,
      request.usuarioId,
      request.usuario,
    );
    return RespuestaApi.exito(reply, "Orden enviada", { orden });
  }

  async registrarRecepcion(request, reply) {
    const orden = await OrdenCompraService.registrarRecepcion(
      request.params.id,
      request.body,
      request.usuarioId,
      request.usuario,
    );
    return RespuestaApi.exito(reply, "Recepción registrada", { orden });
  }

  async anular(request, reply) {
    const orden = await OrdenCompraService.anularOrden(
      request.params.id,
      request.usuarioId,
      request.usuario,
    );
    return RespuestaApi.exito(reply, "Orden anulada", { orden });
  }
}

export default new OrdenCompraController();

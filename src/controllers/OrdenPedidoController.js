import OrdenPedidoService from "../services/OrdenPedidoService.js";
import RespuestaApi from "../utils/RespuestaApi.js";

class OrdenPedidoController {
  async crear(request, reply) {
    const pedido = await OrdenPedidoService.crearPedido(
      request.body,
      request.usuarioId,
    );
    return RespuestaApi.exito(reply, "Pedido creado", { pedido }, 201);
  }

  async listar(request, reply) {
    const pedidos = await OrdenPedidoService.obtenerPedidos();
    return RespuestaApi.exito(reply, "Pedidos obtenidos", { pedidos });
  }

  async listarPaginado(request, reply) {
    const {
      pagina = 1,
      limite = 20,
      sedeSolicitanteId,
      sedeProveedoraId,
      sedeId,
      estado,
    } = request.query;
    const filtros = {};
    if (sedeSolicitanteId) filtros.sedeSolicitanteId = sedeSolicitanteId;
    if (sedeProveedoraId) filtros.sedeProveedoraId = sedeProveedoraId;
    if (sedeId) filtros.sedeId = sedeId;
    if (estado) filtros.estado = estado;

    const resultado = await OrdenPedidoService.obtenerPedidosPaginado(
      Number(pagina),
      Number(limite),
      filtros,
    );
    return RespuestaApi.exito(reply, "Pedidos obtenidos", {
      pedidos: resultado.documentos || [],
      paginacion: resultado.paginacion,
    });
  }

  async obtenerPorId(request, reply) {
    const pedido = await OrdenPedidoService.obtenerPedidoPorId(
      request.params.id,
    );
    return RespuestaApi.exito(reply, "Pedido obtenido", { pedido });
  }

  async responder(request, reply) {
    const pedido = await OrdenPedidoService.responderPedido(
      request.params.id,
      request.body,
      request.usuarioId,
      request.usuario,
    );
    return RespuestaApi.exito(reply, "Pedido respondido", { pedido });
  }

  async anular(request, reply) {
    const pedido = await OrdenPedidoService.anularPedido(
      request.params.id,
      request.usuarioId,
      request.usuario,
    );
    return RespuestaApi.exito(reply, "Pedido anulado", { pedido });
  }
}

export default new OrdenPedidoController();

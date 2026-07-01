import EntradaService from "../services/EntradaService.js";
import RespuestaApi from "../utils/RespuestaApi.js";

class EntradaController {
  async crear(request, reply) {
    const entrada = await EntradaService.crearEntrada(
      request.body,
      request.usuarioId,
      null,
      request.usuario,
    );
    return RespuestaApi.exito(reply, "Entrada registrada", { entrada }, 201);
  }

  async listar(request, reply) {
    const entradas = await EntradaService.obtenerEntradas();
    return RespuestaApi.exito(reply, "Entradas obtenidas", { entradas });
  }

  async listarPaginado(request, reply) {
    const {
      pagina = 1,
      limite = 20,
      sedeId,
      tipo,
      estado,
      proveedorId,
      fechaDesde,
      fechaHasta,
    } = request.query;
    const filtros = {};
    if (sedeId) filtros.sedeId = sedeId;
    if (tipo) filtros.tipo = tipo;
    if (estado) filtros.estado = estado;
    if (proveedorId) filtros.proveedorId = proveedorId;
    if (fechaDesde) filtros.fechaDesde = fechaDesde;
    if (fechaHasta) filtros.fechaHasta = fechaHasta;

    const resultado = await EntradaService.obtenerEntradasPaginado(
      Number(pagina),
      Number(limite),
      filtros,
    );
    return RespuestaApi.exito(reply, "Entradas obtenidas", {
      entradas: resultado.documentos || [],
      paginacion: resultado.paginacion,
    });
  }

  async obtenerPorId(request, reply) {
    const entrada = await EntradaService.obtenerEntradaPorId(request.params.id);
    return RespuestaApi.exito(reply, "Entrada obtenida", { entrada });
  }

  async anular(request, reply) {
    const entrada = await EntradaService.anularEntrada(
      request.params.id,
      request.usuarioId,
      request.usuario,
    );
    return RespuestaApi.exito(reply, "Entrada anulada", { entrada });
  }
}

export default new EntradaController();

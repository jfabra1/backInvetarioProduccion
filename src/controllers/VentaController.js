import VentaService from "../services/VentaService.js";
import RespuestaApi from "../utils/RespuestaApi.js";

class VentaController {
  async crear(request, reply) {
    const venta = await VentaService.crearVenta(request.body, request.usuarioId);
    return RespuestaApi.exito(reply, "Venta registrada", { venta }, 201);
  }

  async listarPaginado(request, reply) {
    const {
      pagina = 1,
      limite = 20,
      sedeId,
      estado,
      clienteId,
      vendedorId,
      fechaDesde,
      fechaHasta,
    } = request.query;

    const filtros = {};
    if (sedeId)     filtros.sedeId     = sedeId;
    if (estado)     filtros.estado     = estado;
    if (clienteId)  filtros.clienteId  = clienteId;
    if (vendedorId) filtros.vendedorId = vendedorId;
    if (fechaDesde) filtros.fechaDesde = fechaDesde;
    if (fechaHasta) filtros.fechaHasta = fechaHasta;

    const resultado = await VentaService.obtenerVentasPaginado(
      Number(pagina),
      Number(limite),
      filtros,
    );
    return RespuestaApi.exito(reply, "Ventas obtenidas", resultado);
  }

  async obtenerPorId(request, reply) {
    const venta = await VentaService.obtenerVentaPorId(request.params.id);
    return RespuestaApi.exito(reply, "Venta obtenida", { venta });
  }

  async anular(request, reply) {
    const venta = await VentaService.anularVenta(request.params.id, request.usuarioId);
    return RespuestaApi.exito(reply, "Venta anulada", { venta });
  }
}

export default new VentaController();

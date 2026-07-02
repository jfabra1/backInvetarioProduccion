import BaseRepository from "./BaseRepository.js";
import OrdenPedido from "../models/OrdenPedido.js";

class OrdenPedidoRepository extends BaseRepository {
  constructor() {
    super(OrdenPedido);
  }

  construirFiltros(filtros) {
    const consulta = {};
    if (filtros.sedeSolicitanteId)
      consulta.sedeSolicitanteId = filtros.sedeSolicitanteId;
    if (filtros.sedeProveedoraId)
      consulta.sedeProveedoraId = filtros.sedeProveedoraId;
    // "Mi sede" (usuario no admin): pedidos donde mi sede pide o donde
    // le están pidiendo a mi sede, para que ambos lados los vean.
    if (filtros.sedeId) {
      consulta.$or = [
        { sedeSolicitanteId: filtros.sedeId },
        { sedeProveedoraId: filtros.sedeId },
      ];
    }
    if (filtros.estado) consulta.estado = filtros.estado;
    return consulta;
  }
}

export default new OrdenPedidoRepository();

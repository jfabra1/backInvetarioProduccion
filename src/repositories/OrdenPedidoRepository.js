import BaseRepository from "./BaseRepository.js";
import OrdenPedido from "../models/OrdenPedido.js";

class OrdenPedidoRepository extends BaseRepository {
  constructor() {
    super(OrdenPedido);
  }

  // Los usuarios no admin no tienen permiso para listar sedes (sedes:ver), así
  // que el frontend no puede resolver sedeSolicitanteId/sedeProveedoraId por su
  // cuenta para ellos. Se poblan aquí para que siempre lleguen con nombre.
  async findPaginado(
    filtro = {},
    pagina = 1,
    limite = 50,
    ordenamiento = { createdAt: -1 },
  ) {
    const saltar = (pagina - 1) * limite;

    const [documentos, total] = await Promise.all([
      this.model
        .find(filtro)
        .populate("sedeSolicitanteId", "nombre codigo")
        .populate("sedeProveedoraId", "nombre codigo")
        .sort(ordenamiento)
        .skip(saltar)
        .limit(limite),
      this.model.countDocuments(filtro),
    ]);

    return {
      documentos,
      paginacion: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total,
        totalPaginas: Math.ceil(total / limite),
        hayPaginaSiguiente: pagina * limite < total,
        hayPaginaAnterior: pagina > 1,
      },
    };
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

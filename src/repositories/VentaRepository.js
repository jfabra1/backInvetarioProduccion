import BaseRepository from "./BaseRepository.js";
import Venta from "../models/Venta.js";

class VentaRepository extends BaseRepository {
  constructor() {
    super(Venta);
  }

  async findAllPaginado(pagina, limite, filtros = {}) {
    const consulta = this.construirFiltros(filtros);
    const saltar = (pagina - 1) * limite;

    const [datos, total] = await Promise.all([
      this.model
        .find(consulta)
        .populate("sedeId", "nombre codigo")
        .populate("clienteId", "razonSocial")
        .populate("vendedorId", "nombre")
        .populate("items.productoId", "nombre codigoInterno codigoExterno")
        .sort({ createdAt: -1 })
        .skip(saltar)
        .limit(limite),
      this.model.countDocuments(consulta),
    ]);

    return {
      ventas: datos,
      paginacion: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(total / limite),
        hayPaginaSiguiente: pagina * limite < total,
        hayPaginaAnterior: pagina > 1,
      },
    };
  }

  construirFiltros(filtros) {
    const consulta = {};
    if (filtros.sedeId)     consulta.sedeId     = filtros.sedeId;
    if (filtros.estado)     consulta.estado     = filtros.estado;
    if (filtros.vendedorId) consulta.vendedorId = filtros.vendedorId;
    if (filtros.clienteId)  consulta.clienteId  = filtros.clienteId;
    if (filtros.fechaDesde || filtros.fechaHasta) {
      consulta.createdAt = {};
      if (filtros.fechaDesde) consulta.createdAt.$gte = new Date(filtros.fechaDesde);
      if (filtros.fechaHasta) consulta.createdAt.$lte = new Date(filtros.fechaHasta);
    }
    return consulta;
  }
}

export default new VentaRepository();

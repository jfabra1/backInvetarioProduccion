import BaseRepository from "./BaseRepository.js";
import Entrada from "../models/Entrada.js";

class EntradaRepository extends BaseRepository {
  constructor() {
    super(Entrada);
  }

  async findPaginado(filtros = {}, pagina = 1, limite = 20) {
    const consulta = this.construirFiltros(filtros);
    const saltar = (pagina - 1) * limite;

    const [documentos, total] = await Promise.all([
      this.model
        .find(consulta)
        .populate("sedeId", "nombre codigo")
        .populate("proveedorId", "razonSocial")
        .populate("creadoPor", "nombre")
        .populate("items.productoId", "nombre codigoInterno")
        .sort({ createdAt: -1 })
        .skip(saltar)
        .limit(limite),
      this.model.countDocuments(consulta),
    ]);

    return {
      documentos,
      paginacion: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
        hayPaginaAnterior: pagina > 1,
        hayPaginaSiguiente: pagina < Math.ceil(total / limite),
      },
    };
  }

  construirFiltros(filtros) {
    const consulta = {};
    if (filtros.sedeId) consulta.sedeId = filtros.sedeId;
    if (filtros.tipo) consulta.tipo = filtros.tipo;
    if (filtros.estado) consulta.estado = filtros.estado;
    if (filtros.proveedorId) consulta.proveedorId = filtros.proveedorId;
    if (filtros.fechaDesde || filtros.fechaHasta) {
      consulta.createdAt = {};
      if (filtros.fechaDesde)
        consulta.createdAt.$gte = new Date(filtros.fechaDesde);
      if (filtros.fechaHasta)
        consulta.createdAt.$lte = new Date(filtros.fechaHasta);
    }
    return consulta;
  }
}

export default new EntradaRepository();

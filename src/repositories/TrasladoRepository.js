import BaseRepository from "./BaseRepository.js";
import Traslado from "../models/Traslado.js";

class TrasladoRepository extends BaseRepository {
  constructor() {
    super(Traslado);
  }

  async findAllPaginado(pagina, limite, filtros = {}) {
    const consulta = this.construirFiltros(filtros);
    const saltar = (pagina - 1) * limite;

    const [datos, total] = await Promise.all([
      this.model
        .find(consulta)
        .populate("sedeOrigenId", "nombre codigo")
        .populate("sedeDestinoId", "nombre codigo")
        .populate("solicitadoPor", "nombre")
        .populate("aprobadoPor", "nombre")
        .populate("items.productoId", "nombre codigoInterno")
        .sort({ createdAt: -1 })
        .skip(saltar)
        .limit(limite),
      this.model.countDocuments(consulta),
    ]);

    return {
      datos,
      paginacion: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
        tieneAnterior: pagina > 1,
        tieneSiguiente: pagina < Math.ceil(total / limite),
      },
    };
  }

  construirFiltros(filtros) {
    const consulta = {};
    if (filtros.sedeOrigenId) consulta.sedeOrigenId = filtros.sedeOrigenId;
    if (filtros.sedeDestinoId) consulta.sedeDestinoId = filtros.sedeDestinoId;
    // "Mi sede" (usuario no admin): traslados donde mi sede es origen O destino,
    // para que la bodega que recibe también los vea (y pueda aceptarlos).
    if (filtros.sedeId) {
      consulta.$or = [
        { sedeOrigenId: filtros.sedeId },
        { sedeDestinoId: filtros.sedeId },
      ];
    }
    if (filtros.estado) consulta.estado = filtros.estado;
    return consulta;
  }
}

export default new TrasladoRepository();

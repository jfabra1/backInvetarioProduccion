import BaseRepository from "./BaseRepository.js";
import AjusteInventario from "../models/AjusteInventario.js";

class AjusteInventarioRepository extends BaseRepository {
  constructor() {
    super(AjusteInventario);
  }

  async findPaginado(filtros = {}, pagina = 1, limite = 20) {
    const consulta = {};
    if (filtros.sedeId) consulta.sedeId = filtros.sedeId;
    if (filtros.estado) consulta.estado = filtros.estado;

    const saltar = (pagina - 1) * limite;
    const [documentos, total] = await Promise.all([
      this.model
        .find(consulta)
        .populate("sedeId", "nombre codigo")
        .populate("creadoPor", "nombre")
        .populate("aprobadoPor", "nombre")
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
}

export default new AjusteInventarioRepository();

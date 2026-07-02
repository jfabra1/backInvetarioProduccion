import BaseRepository from "./BaseRepository.js";
import Rack from "../models/Rack.js";

class RackRepository extends BaseRepository {
  constructor() {
    super(Rack);
  }

  async findByNombreYSede(nombre, sedeId) {
    return this.model.findOne({ nombre, sedeId, activo: true });
  }

  async findPaginado(filtro = {}, pagina = 1, limite = 50, ordenamiento = { createdAt: -1 }) {
    const saltar = (pagina - 1) * limite;

    const [documentos, total] = await Promise.all([
      this.model
        .find(filtro)
        .populate("sedeId", "nombre codigo")
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

  async findAll(filtro = {}) {
    return this.model
      .find(filtro)
      .populate("sedeId", "nombre codigo")
      .sort({ nombre: 1 });
  }

  async findByIdConSede(id) {
    return this.model.findById(id).populate("sedeId", "nombre codigo");
  }

  construirFiltros(filtros) {
    const consulta = {};
    if (!filtros.incluirInactivos) consulta.activo = true;
    if (filtros.sedeId) consulta.sedeId = filtros.sedeId;
    if (filtros.nombre) consulta.nombre = { $regex: filtros.nombre, $options: "i" };
    return consulta;
  }
}

export default new RackRepository();

import BaseRepository from "./BaseRepository.js";
import OrdenDespacho from "../models/OrdenDespacho.js";

class OrdenDespachoRepository extends BaseRepository {
  constructor() {
    super(OrdenDespacho);
  }

  // Sobrescribe BaseRepository.findPaginado (que es lo que llama el servicio)
  // para poblar productos, sede y tercero. Antes este método se llamaba
  // findAllPaginado, nunca se usaba, y la API devolvía solo ids.
  async findPaginado(filtros = {}, pagina = 1, limite = 20) {
    const consulta = {};
    if (filtros.sedeId) consulta.sedeId = filtros.sedeId;
    if (filtros.estado) consulta.estado = filtros.estado;
    if (filtros.clienteId) consulta.clienteId = filtros.clienteId;

    const saltar = (pagina - 1) * limite;
    const [documentos, total] = await Promise.all([
      this.model
        .find(consulta)
        .populate("sedeId", "nombre codigo")
        .populate("clienteId", "razonSocial")
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
}

export default new OrdenDespachoRepository();

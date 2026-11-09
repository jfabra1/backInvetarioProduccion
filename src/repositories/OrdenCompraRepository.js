import BaseRepository from "./BaseRepository.js";
import OrdenCompra from "../models/OrdenCompra.js";

class OrdenCompraRepository extends BaseRepository {
  constructor() {
    super(OrdenCompra);
  }

  // Sobrescribe BaseRepository.findPaginado (que es lo que llama el servicio)
  // para poblar productos, sede y tercero. Antes este método se llamaba
  // findAllPaginado, nunca se usaba, y la API devolvía solo ids.
  async findPaginado(filtros = {}, pagina = 1, limite = 20) {
    const consulta = this.construirFiltros(filtros);
    const saltar = (pagina - 1) * limite;

    const [documentos, total] = await Promise.all([
      this.model
        .find(consulta)
        .populate("proveedorId", "razonSocial")
        .populate("sedeId", "nombre codigo")
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
    if (filtros.proveedorId) consulta.proveedorId = filtros.proveedorId;
    if (filtros.sedeId) consulta.sedeId = filtros.sedeId;
    if (filtros.estado) consulta.estado = filtros.estado;
    return consulta;
  }
}

export default new OrdenCompraRepository();

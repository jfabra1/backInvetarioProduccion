import BaseRepository from "./BaseRepository.js";
import Producto from "../models/Producto.js";

class ProductoRepository extends BaseRepository {
  constructor() {
    super(Producto);
  }

  async findByCodigoInterno(codigo) {
    return this.model.findOne({ codigoInterno: codigo, activo: true });
  }

  async findByCodigoExterno(codigo) {
    return this.model.findOne({ codigoExterno: codigo, activo: true });
  }

  async findPaginadoConUnidades(
    filtro = {},
    pagina = 1,
    limite = 50,
    ordenamiento = { createdAt: -1 },
  ) {
    const saltar = (pagina - 1) * limite;

    const [documentos, total] = await Promise.all([
      this.model
        .find(filtro)
        .populate("unidadMedidaId", "codigo nombre")
        .populate("presentaciones.unidadMedidaId", "codigo nombre")
        .populate("presentaciones.unidadContenidoId", "codigo nombre")
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
    if (filtros.activo !== undefined) {
      consulta.activo = filtros.activo;
    }
    if (filtros.nombre)
      consulta.nombre = { $regex: filtros.nombre, $options: "i" };
    if (filtros.categoriaId) consulta.categoriaId = filtros.categoriaId;
    if (filtros.subcategoriaId)
      consulta.subcategoriaId = filtros.subcategoriaId;
    if (filtros.codigoInterno)
      consulta.codigoInterno = { $regex: filtros.codigoInterno, $options: "i" };
    if (filtros.codigoExterno)
      consulta.codigoExterno = { $regex: filtros.codigoExterno, $options: "i" };
    if (filtros.busqueda) {
      const regex = { $regex: filtros.busqueda, $options: "i" };
      consulta.$or = [
        { nombre: regex },
        { codigoInterno: regex },
        { codigoExterno: regex },
        { referencia: regex },
      ];
    }
    return consulta;
  }
}

export default new ProductoRepository();

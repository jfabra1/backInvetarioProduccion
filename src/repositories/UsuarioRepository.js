import BaseRepository from "./BaseRepository.js";
import Usuario from "../models/Usuario.js";

class UsuarioRepository extends BaseRepository {
  constructor() {
    super(Usuario);
  }

  async findById(id) {
    return await this.model.findById(id).populate("sedeId", "nombre");
  }

  async findByEmail(email) {
    return await this.model.findOne({ email, activo: true }).populate("sedeId", "nombre");
  }

  async findByIdConRol(id) {
    return await this.model
      .findOne({ _id: id, activo: true })
      .populate("rolId")
      .populate("sedeId");
  }

  async findAllActivos(filtros = {}) {
    const consulta = { activo: true, ...this.construirFiltros(filtros) };
    return await this.model
      .find(consulta)
      .select("-passwordHash")
      .populate("rolId", "nombre")
      .populate("sedeId", "nombre")
      .sort({ nombre: 1 });
  }

  async findAll(filtros = {}) {
    const consulta = this.construirFiltros(filtros);
    if (filtros.activo !== undefined) {
      consulta.activo = filtros.activo;
    }

    return await this.model
      .find(consulta)
      .select("-passwordHash")
      .populate("rolId", "nombre")
      .populate("sedeId", "nombre")
      .sort({ nombre: 1 });
  }

  async findAllPaginado(pagina = 1, limite = 50, filtros = {}) {
    const saltar = (pagina - 1) * limite;
    const consulta = this.construirFiltros(filtros);
    if (filtros.activo !== undefined) {
      consulta.activo = filtros.activo;
    }

    const [usuarios, total] = await Promise.all([
      this.model
        .find(consulta)
        .select("-passwordHash")
        .populate("rolId", "nombre")
        .populate("sedeId", "nombre")
        .sort({ createdAt: -1 })
        .skip(saltar)
        .limit(limite),
      this.model.countDocuments(consulta),
    ]);

    return {
      usuarios,
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

  async findByTokenRecuperacion(token) {
    return await this.model.findOne({
      tokenRecuperacion: token,
      expiracionTokenRecuperacion: { $gt: new Date() },
      activo: true,
    });
  }

  construirFiltros(filtros = {}) {
    const consulta = {};
    if (filtros.nombre) {
      consulta.nombre = { $regex: filtros.nombre, $options: "i" };
    }
    if (filtros.email) {
      consulta.email = { $regex: filtros.email, $options: "i" };
    }
    if (filtros.rolId) {
      consulta.rolId = filtros.rolId;
    }
    if (filtros.sedeId) {
      consulta.sedeId = filtros.sedeId;
    }
    if (filtros.esAdmin !== undefined) {
      consulta.esAdmin = filtros.esAdmin;
    }
    return consulta;
  }
}

export default new UsuarioRepository();

import BaseRepository from "./BaseRepository.js";
import Producto from "../models/Producto.js";

// Convierte cada vocal (y la "n") de un texto ya escapado en una clase que
// acepta sus variantes con tilde: "lamina" → "l[aáàäâ]m[iíìïî]n[aáàäâ]".
const VARIANTES_TILDE = {
  a: "aáàäâ", e: "eéèëê", i: "iíìïî", o: "oóòöô", u: "uúùüû", n: "nñ",
};
const regexSinTildes = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[aeioun]/gi, (letra) => `[${VARIANTES_TILDE[letra.toLowerCase()]}]`);

const escaparRegex = (texto = "") =>
  String(texto).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const palabrasDeBusqueda = (busqueda) =>
  String(busqueda || "").trim().split(/\s+/).filter(Boolean).slice(0, 8);

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

  async findByCodigo(codigo) {
    const q = (codigo || "").trim();
    return this.model.findOne({
      activo: true,
      $or: [{ codigoExterno: q }, { codigoInterno: q }],
    });
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

  /**
   * Igual que findPaginadoConUnidades, pero ordenado por relevancia frente a
   * la búsqueda: al buscar por palabras sueltas, "Producto 001" también
   * coincide con códigos como PRD-00100, y ordenado solo por fecha el producto
   * exacto podía quedar fuera de los primeros resultados.
   *   4 → código interno/externo o referencia exactos
   *   3 → el nombre contiene la frase completa tal como se escribió
   *   2 → todas las palabras están en el nombre (no solo en los códigos)
   *   0 → el resto (coincide por códigos)
   * Dentro de cada nivel, los más recientes primero.
   */
  async findPaginadoPorRelevancia(filtro, busqueda, pagina = 1, limite = 50) {
    const saltar = (pagina - 1) * limite;
    const texto = String(busqueda).trim();
    const palabras = palabrasDeBusqueda(texto);

    const regexExacto = `^${escaparRegex(texto)}$`;
    const regexFrase = regexSinTildes(escaparRegex(texto));
    const coincide = (campo, regex) => ({
      $regexMatch: { input: { $ifNull: [campo, ""] }, regex, options: "i" },
    });

    // aggregate() no castea como find(): se castea el filtro con el schema
    // (ids de categoría/sede llegan como string desde el query).
    const filtroCasteado = this.model.find().cast(this.model, filtro);

    const [ordenados, total] = await Promise.all([
      this.model.aggregate([
        { $match: filtroCasteado },
        {
          $addFields: {
            _relevancia: {
              $switch: {
                branches: [
                  {
                    case: {
                      $or: [
                        coincide("$codigoInterno", regexExacto),
                        coincide("$codigoExterno", regexExacto),
                        coincide("$referencia", regexExacto),
                      ],
                    },
                    then: 4,
                  },
                  { case: coincide("$nombre", regexFrase), then: 3 },
                  {
                    case: {
                      $and: palabras.map((p) =>
                        coincide("$nombre", regexSinTildes(escaparRegex(p))),
                      ),
                    },
                    then: 2,
                  },
                ],
                default: 0,
              },
            },
          },
        },
        { $sort: { _relevancia: -1, createdAt: -1, _id: 1 } },
        { $skip: saltar },
        { $limit: limite },
        { $project: { _id: 1 } },
      ]),
      this.model.countDocuments(filtro),
    ]);

    const ids = ordenados.map((d) => d._id);
    const encontrados = await this.model
      .find({ _id: { $in: ids } })
      .populate("unidadMedidaId", "codigo nombre")
      .populate("presentaciones.unidadMedidaId", "codigo nombre")
      .populate("presentaciones.unidadContenidoId", "codigo nombre");
    const porId = new Map(encontrados.map((d) => [String(d._id), d]));
    const documentos = ids.map((id) => porId.get(String(id))).filter(Boolean);

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
      consulta.nombre = { $regex: escaparRegex(filtros.nombre), $options: "i" };
    if (filtros.categoriaId) consulta.categoriaId = filtros.categoriaId;
    if (filtros.subcategoriaId)
      consulta.subcategoriaId = filtros.subcategoriaId;
    if (filtros.codigoInterno)
      consulta.codigoInterno = { $regex: escaparRegex(filtros.codigoInterno), $options: "i" };
    if (filtros.codigoExterno)
      consulta.codigoExterno = { $regex: escaparRegex(filtros.codigoExterno), $options: "i" };
    if (filtros.busqueda) {
      // Cada palabra se busca por separado (en cualquier orden y posición) y
      // sin distinguir tildes: "lamina 20" encuentra "Lámina galvanizada
      // calibre 20". Antes se buscaba el texto completo tal cual, y había que
      // escribir el nombre exacto para que apareciera.
      const palabras = palabrasDeBusqueda(filtros.busqueda);
      if (palabras.length > 0) {
        consulta.$and = palabras.map((palabra) => {
          const regex = { $regex: regexSinTildes(escaparRegex(palabra)), $options: "i" };
          return {
            $or: [
              { nombre: regex },
              { codigoInterno: regex },
              { codigoExterno: regex },
              { referencia: regex },
            ],
          };
        });
      }
    }
    return consulta;
  }
}

export default new ProductoRepository();

const schemaCrearCategoria = {
  summary: "Crear categoría",
  description: "Crear nueva categoría",
  tags: ["Categorías"],
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["nombre"],
    properties: {
      nombre: { type: "string", minLength: 2, maxLength: 100 },
      descripcion: { type: "string", maxLength: 200 },
      grupoId: { type: "string", nullable: true },
    },
    additionalProperties: false,
  },
  response: {
    201: { description: "Categoría creada exitosamente" },
    400: { description: "Datos inválidos" },
  },
};

const schemaListarCategorias = {
  summary: "Listar categorías",
  description: "Listar categorías activas con subcategorías",
  tags: ["Categorías"],
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: "Categorías obtenidas",
      type: "object",
      properties: {
        statusCode: { type: "integer" },
        status: { type: "string" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            categorias: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
        },
      },
      example: {
        statusCode: 200,
        status: "success",
        message: "Categorías obtenidas",
        data: {
          categorias: [
            {
              _id: "67f9fdbb2f44a6c9c22b1001",
              nombre: "Abrasivos",
              descripcion: "Consumibles para corte y desbaste",
              subcategorias: [
                {
                  _id: "67f9fdbb2f44a6c9c22b2001",
                  nombre: "Discos de corte",
                  activo: true,
                },
              ],
              activo: true,
            },
          ],
        },
      },
    },
  },
};

const schemaListarCategoriasPaginado = {
  summary: "Listar categorías paginado",
  description: "Listar categorías activas con paginación y filtros",
  tags: ["Categorías"],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: "object",
    properties: {
      pagina: { type: "integer", minimum: 1, default: 1 },
      limite: { type: "integer", minimum: 1, maximum: 1000, default: 50 },
      nombre: { type: "string" },
      descripcion: { type: "string" },
      subcategoriaNombre: { type: "string" },
      busqueda: { type: "string" },
    },
  },
  response: {
    200: {
      description: "Categorías obtenidas",
      type: "object",
      properties: {
        statusCode: { type: "integer" },
        status: { type: "string" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            categorias: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: true,
              },
            },
            paginacion: {
              type: "object",
              properties: {
                pagina: { type: "integer" },
                limite: { type: "integer" },
                total: { type: "integer" },
                totalPaginas: { type: "integer" },
                hayPaginaSiguiente: { type: "boolean" },
                hayPaginaAnterior: { type: "boolean" },
              },
            },
          },
        },
      },
      example: {
        statusCode: 200,
        status: "success",
        message: "Categorías obtenidas",
        data: {
          categorias: [
            {
              _id: "67f9fdbb2f44a6c9c22b1001",
              nombre: "Abrasivos",
              descripcion: "Consumibles para corte y desbaste",
              subcategorias: [
                {
                  _id: "67f9fdbb2f44a6c9c22b2001",
                  nombre: "Discos de corte",
                  activo: true,
                },
              ],
              activo: true,
            },
          ],
          paginacion: {
            pagina: 1,
            limite: 50,
            total: 1,
            totalPaginas: 1,
            hayPaginaSiguiente: false,
            hayPaginaAnterior: false,
          },
        },
      },
    },
  },
};

const schemaObtenerCategoria = {
  summary: "Obtener categoría",
  description: "Obtener categoría por ID",
  tags: ["Categorías"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  response: {
    200: { description: "Categoría obtenida" },
    404: { description: "Categoría no encontrada" },
  },
};

const schemaActualizarCategoria = {
  summary: "Actualizar categoría",
  description: "Actualizar categoría",
  tags: ["Categorías"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      nombre: { type: "string", minLength: 2, maxLength: 100 },
      descripcion: { type: "string", maxLength: 200 },
      grupoId: { type: "string", nullable: true },
    },
    additionalProperties: false,
  },
  response: {
    200: { description: "Categoría actualizada" },
    404: { description: "Categoría no encontrada" },
  },
};

const schemaEliminarCategoria = {
  summary: "Eliminar categoría",
  description: "Eliminar categoría (soft delete)",
  tags: ["Categorías"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  response: {
    200: { description: "Categoría desactivada" },
    404: { description: "Categoría no encontrada" },
  },
};

const schemaAgregarSubcategoria = {
  summary: "Agregar subcategoría",
  description: "Agregar subcategoría a una categoría",
  tags: ["Categorías"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  body: {
    type: "object",
    required: ["nombre"],
    properties: {
      nombre: { type: "string", minLength: 2, maxLength: 100 },
      descripcion: { type: "string", maxLength: 200 },
    },
    additionalProperties: false,
  },
  response: {
    201: { description: "Subcategoría agregada" },
    404: { description: "Categoría no encontrada" },
  },
};

const schemaActualizarSubcategoria = {
  summary: "Actualizar subcategoría",
  description: "Actualizar subcategoría",
  tags: ["Categorías"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" }, subId: { type: "string" } },
    required: ["id", "subId"],
  },
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      nombre: { type: "string", minLength: 2, maxLength: 100 },
      descripcion: { type: "string", maxLength: 200 },
    },
    additionalProperties: false,
  },
  response: {
    200: { description: "Subcategoría actualizada" },
    404: { description: "Subcategoría no encontrada" },
  },
};

const schemaEliminarSubcategoria = {
  summary: "Eliminar subcategoría",
  description: "Eliminar subcategoría (soft delete)",
  tags: ["Categorías"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" }, subId: { type: "string" } },
    required: ["id", "subId"],
  },
  response: {
    200: { description: "Subcategoría desactivada" },
    404: { description: "Subcategoría no encontrada" },
  },
};

const categoriaTags = [
  { name: "Categorías", description: "Gestión de categorías y subcategorías" },
];

export {
  schemaCrearCategoria,
  schemaListarCategorias,
  schemaListarCategoriasPaginado,
  schemaObtenerCategoria,
  schemaActualizarCategoria,
  schemaEliminarCategoria,
  schemaAgregarSubcategoria,
  schemaActualizarSubcategoria,
  schemaEliminarSubcategoria,
  categoriaTags,
};

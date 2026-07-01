const itemTrasladoSchema = {
  type: "object",
  required: ["productoId", "cantidadSolicitada"],
  properties: {
    productoId: { type: "string" },
    cantidadSolicitada: { type: "number", minimum: 1 },
    observacion: { type: "string", maxLength: 200 },
  },
};

const schemaCrearTraslado = {
  summary: "Crear traslado",
  description: "Crear solicitud de traslado entre sedes",
  tags: ["Traslados"],
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["sedeOrigenId", "sedeDestinoId", "items"],
    properties: {
      sedeOrigenId: { type: "string" },
      sedeDestinoId: { type: "string" },
      items: { type: "array", items: itemTrasladoSchema, minItems: 1 },
      observaciones: { type: "string", maxLength: 500 },
    },
    additionalProperties: false,
  },
  response: {
    201: { description: "Traslado creado exitosamente" },
    400: { description: "Datos inválidos" },
  },
};

const schemaListarTraslados = {
  summary: "Listar traslados",
  description: "Listar traslados",
  tags: ["Traslados"],
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: "Traslados obtenidos",
      type: "object",
      properties: {
        statusCode: { type: "integer" },
        status: { type: "string" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            traslados: {
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
        message: "Traslados obtenidos",
        data: {
          traslados: [
            {
              _id: "67f9fdbb2f44a6c9c2331001",
              codigo: "TRS00001",
              estado: "pendiente",
            },
          ],
        },
      },
    },
  },
};

const schemaListarTrasladosPaginado = {
  summary: "Listar traslados paginado",
  description: "Listar traslados con filtros y paginación",
  tags: ["Traslados"],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: "object",
    properties: {
      pagina: { type: "integer", minimum: 1, default: 1 },
      limite: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      sedeOrigenId: { type: "string" },
      sedeDestinoId: { type: "string" },
      sedeId: {
        type: "string",
        description: "Traslados donde esta sede es origen o destino",
      },
      estado: { type: "string" },
    },
  },
  response: {
    200: {
      description: "Traslados obtenidos",
      type: "object",
      properties: {
        statusCode: { type: "integer" },
        status: { type: "string" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            traslados: {
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
        message: "Traslados obtenidos",
        data: {
          traslados: [
            {
              _id: "67f9fdbb2f44a6c9c2331001",
              codigo: "TRS00001",
              estado: "pendiente",
            },
          ],
          paginacion: {
            pagina: 1,
            limite: 20,
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

const schemaObtenerTraslado = {
  summary: "Obtener traslado",
  description: "Obtener traslado por ID",
  tags: ["Traslados"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  response: {
    200: { description: "Traslado obtenido" },
    404: { description: "Traslado no encontrado" },
  },
};

const schemaAprobarTraslado = {
  summary: "Aprobar traslado",
  description: "Aprobar/rechazar traslado (total o parcial por producto)",
  tags: ["Traslados"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  body: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          required: ["itemId", "cantidadAprobada"],
          properties: {
            itemId: { type: "string" },
            cantidadAprobada: { type: "number", minimum: 0 },
          },
        },
      },
    },
    additionalProperties: false,
  },
  response: {
    200: { description: "Traslado aprobado" },
    404: { description: "Traslado no encontrado" },
  },
};

const schemaDespacharTraslado = {
  summary: "Despachar traslado",
  description: "Despachar traslado aprobado (genera salida en sede origen)",
  tags: ["Traslados"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  response: {
    200: { description: "Traslado despachado" },
    404: { description: "Traslado no encontrado" },
  },
};

const schemaRecibirTraslado = {
  summary: "Recibir traslado",
  description: "Recibir traslado en sede destino (genera entrada)",
  tags: ["Traslados"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  response: {
    200: { description: "Traslado recibido" },
    404: { description: "Traslado no encontrado" },
  },
};

const trasladoTags = [
  { name: "Traslados", description: "Solicitudes de traslado entre sedes" },
];

export {
  schemaCrearTraslado,
  schemaListarTraslados,
  schemaListarTrasladosPaginado,
  schemaObtenerTraslado,
  schemaAprobarTraslado,
  schemaDespacharTraslado,
  schemaRecibirTraslado,
  trasladoTags,
};

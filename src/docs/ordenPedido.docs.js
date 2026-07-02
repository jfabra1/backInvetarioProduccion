const itemOrdenPedidoSchema = {
  type: "object",
  required: ["productoId", "cantidadSolicitada"],
  properties: {
    productoId: { type: "string" },
    cantidadSolicitada: { type: "number", minimum: 1 },
  },
};

const schemaCrearOrdenPedido = {
  summary: "Crear orden de pedido",
  description: "Solicitar productos a otra sede",
  tags: ["OrdenesPedido"],
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["sedeSolicitanteId", "sedeProveedoraId", "items"],
    properties: {
      sedeSolicitanteId: { type: "string" },
      sedeProveedoraId: { type: "string" },
      items: { type: "array", items: itemOrdenPedidoSchema, minItems: 1 },
      observaciones: { type: "string", maxLength: 500 },
    },
    additionalProperties: false,
  },
  response: {
    201: { description: "Pedido creado exitosamente" },
    400: { description: "Datos inválidos" },
  },
};

const schemaListarOrdenesPedido = {
  summary: "Listar pedidos",
  description: "Listar órdenes de pedido",
  tags: ["OrdenesPedido"],
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: "Pedidos obtenidos",
      type: "object",
      properties: {
        statusCode: { type: "integer" },
        status: { type: "string" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            pedidos: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
          },
        },
      },
      example: {
        statusCode: 200,
        status: "success",
        message: "Pedidos obtenidos",
        data: {
          pedidos: [
            {
              _id: "67f9fdbb2f44a6c9c2331101",
              codigo: "PED-00001",
              estado: "pendiente",
            },
          ],
        },
      },
    },
  },
};

const schemaListarOrdenesPedidoPaginado = {
  summary: "Listar pedidos paginado",
  description: "Listar órdenes de pedido con filtros y paginación",
  tags: ["OrdenesPedido"],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: "object",
    properties: {
      pagina: { type: "integer", minimum: 1, default: 1 },
      limite: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      sedeSolicitanteId: { type: "string" },
      sedeProveedoraId: { type: "string" },
      sedeId: {
        type: "string",
        description: "Pedidos donde esta sede es solicitante o proveedora",
      },
      estado: { type: "string" },
    },
  },
  response: {
    200: {
      description: "Pedidos obtenidos",
      type: "object",
      properties: {
        statusCode: { type: "integer" },
        status: { type: "string" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            pedidos: {
              type: "array",
              items: { type: "object", additionalProperties: true },
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
        message: "Pedidos obtenidos",
        data: {
          pedidos: [
            {
              _id: "67f9fdbb2f44a6c9c2331101",
              codigo: "PED-00001",
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

const schemaObtenerOrdenPedido = {
  summary: "Obtener pedido",
  description: "Obtener orden de pedido por ID",
  tags: ["OrdenesPedido"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  response: {
    200: { description: "Pedido obtenido" },
    404: { description: "Pedido no encontrado" },
  },
};

const schemaResponderOrdenPedido = {
  summary: "Responder pedido",
  description:
    "La sede proveedora acepta (total o parcial, con nota por producto) o rechaza el pedido; si acepta, se genera automáticamente un traslado ya despachado",
  tags: ["OrdenesPedido"],
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
            observacion: { type: "string", maxLength: 200 },
          },
        },
      },
    },
    additionalProperties: false,
  },
  response: {
    200: { description: "Pedido respondido" },
    404: { description: "Pedido no encontrado" },
  },
};

const schemaAnularOrdenPedido = {
  summary: "Anular pedido",
  description: "Anular pedido pendiente",
  tags: ["OrdenesPedido"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  response: {
    200: { description: "Pedido anulado" },
    404: { description: "Pedido no encontrado" },
  },
};

const ordenPedidoTags = [
  { name: "OrdenesPedido", description: "Solicitudes de productos entre sedes" },
];

export {
  schemaCrearOrdenPedido,
  schemaListarOrdenesPedido,
  schemaListarOrdenesPedidoPaginado,
  schemaObtenerOrdenPedido,
  schemaResponderOrdenPedido,
  schemaAnularOrdenPedido,
  ordenPedidoTags,
};

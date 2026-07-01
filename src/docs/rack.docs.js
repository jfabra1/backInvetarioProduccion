const schemaCrearRack = {
  summary: "Crear rack",
  description: "Crear un nuevo rack de almacenamiento con su grilla de filas x columnas",
  tags: ["Racks"],
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["nombre", "sedeId", "filas", "columnas"],
    properties: {
      nombre: { type: "string", minLength: 2, maxLength: 100 },
      sedeId: { type: "string" },
      filas: { type: "integer", minimum: 1, maximum: 50 },
      columnas: { type: "integer", minimum: 1, maximum: 50 },
    },
    additionalProperties: false,
  },
  response: {
    201: { description: "Rack creado exitosamente" },
    400: { description: "Datos inválidos" },
  },
};

const schemaListarRacks = {
  summary: "Listar racks",
  description: "Listar racks (activos por defecto), cada uno con sus posiciones calculadas",
  tags: ["Racks"],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: "object",
    properties: {
      sedeId: { type: "string" },
      incluirInactivos: { type: "boolean", default: false },
    },
  },
  response: {
    200: { description: "Racks obtenidos" },
  },
};

const schemaListarRacksPaginado = {
  summary: "Listar racks paginado",
  description: "Listar racks con paginación y filtros",
  tags: ["Racks"],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: "object",
    properties: {
      pagina: { type: "integer", minimum: 1, default: 1 },
      limite: { type: "integer", minimum: 1, maximum: 100, default: 50 },
      sedeId: { type: "string" },
      nombre: { type: "string" },
      incluirInactivos: { type: "boolean", default: false },
    },
  },
  response: {
    200: { description: "Racks obtenidos" },
  },
};

const schemaObtenerRack = {
  summary: "Obtener rack",
  description: "Obtener rack por ID con sus posiciones calculadas",
  tags: ["Racks"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  response: {
    200: { description: "Rack obtenido" },
    404: { description: "Rack no encontrado" },
  },
};

const schemaActualizarRack = {
  summary: "Actualizar rack",
  description: "Actualizar datos de un rack",
  tags: ["Racks"],
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
      sedeId: { type: "string" },
      filas: { type: "integer", minimum: 1, maximum: 50 },
      columnas: { type: "integer", minimum: 1, maximum: 50 },
    },
    additionalProperties: false,
  },
  response: {
    200: { description: "Rack actualizado" },
    404: { description: "Rack no encontrado" },
  },
};

const schemaEliminarRack = {
  summary: "Desactivar rack",
  description: "Desactivar rack (soft delete)",
  tags: ["Racks"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  response: {
    200: { description: "Rack desactivado" },
    404: { description: "Rack no encontrado" },
  },
};

const schemaActualizarEstadoRack = {
  summary: "Actualizar estado de rack",
  description: "Activar o desactivar un rack",
  tags: ["Racks"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  body: {
    type: "object",
    required: ["activo"],
    properties: { activo: { type: "boolean" } },
    additionalProperties: false,
  },
  response: {
    200: { description: "Estado actualizado" },
    404: { description: "Rack no encontrado" },
  },
};

const rackTags = [
  { name: "Racks", description: "Configuración de racks de almacenamiento (filas x columnas)" },
];

export {
  schemaCrearRack,
  schemaListarRacks,
  schemaListarRacksPaginado,
  schemaObtenerRack,
  schemaActualizarRack,
  schemaEliminarRack,
  schemaActualizarEstadoRack,
  rackTags,
};

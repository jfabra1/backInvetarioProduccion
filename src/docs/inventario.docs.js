const schemaStockPorSede = {
  description: "Obtener stock de una sede",
  tags: ["Inventario"],
  params: {
    type: "object",
    properties: { sedeId: { type: "string" } },
    required: ["sedeId"],
  },
  querystring: {
    type: "object",
    properties: {
      productoId: { type: "string" },
      productoIds: { type: "string", description: "IDs de producto separados por coma" },
    },
  },
};

const schemaStockGlobal = {
  description: "Obtener stock global (todas las sedes)",
  tags: ["Inventario"],
  querystring: {
    type: "object",
    properties: {
      productoId: { type: "string" },
      productoIds: { type: "string", description: "IDs de producto separados por coma" },
    },
  },
};

const schemaStockProducto = {
  description: "Obtener stock de un producto en todas las sedes",
  tags: ["Inventario"],
  params: {
    type: "object",
    properties: { productoId: { type: "string" } },
    required: ["productoId"],
  },
};

const inventarioTags = [
  { name: "Inventario", description: "Vista de stock por sede y global" },
];

export {
  schemaStockPorSede,
  schemaStockGlobal,
  schemaStockProducto,
  inventarioTags,
};

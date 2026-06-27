import mongoose from "mongoose";
import { trazabilidadSchema } from "../utils/trazabilidad.util.js";

const itemVentaSchema = new mongoose.Schema(
  {
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Producto",
      required: true,
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1,
    },
    codigoExterno: {
      type: String,
      trim: true,
    },
  },
  { _id: true },
);

const ventaSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    sedeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sede",
      required: true,
    },
    clienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tercero",
      default: null,
    },
    vendedorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    items: [itemVentaSchema],
    observaciones: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    estado: {
      type: String,
      enum: ["aplicada", "anulada"],
      default: "aplicada",
    },
    trazabilidad: {
      type: [trazabilidadSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

ventaSchema.index({ sedeId: 1, createdAt: -1 });
ventaSchema.index({ vendedorId: 1 });
ventaSchema.index({ estado: 1 });

const Venta = mongoose.model("Venta", ventaSchema);
export default Venta;

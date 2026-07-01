import mongoose from "mongoose";
import { trazabilidadSchema } from "../utils/trazabilidad.util.js";

const presentacionSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "unidad",
    },
    unidadMedidaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UnidadMedida",
      default: null,
    },
    cantidadPorUnidad: { type: Number, default: 0, min: 0 },
    unidadContenidoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UnidadMedida",
      default: null,
    },
    cantidadInterna: { type: Number, default: 0, min: 0 },
    metrosLineales: { type: Number, default: 0, min: 0 },
    largoCm: { type: Number, default: 0, min: 0 },
    anchoCm: { type: Number, default: 0, min: 0 },
    altoCm: { type: Number, default: 0, min: 0 },
    espesorMm: { type: Number, default: 0, min: 0 },
    pesoKg: { type: Number, default: 0, min: 0 },
    descripcion: { type: String, trim: true, maxlength: 250 },
  },
  { _id: true, timestamps: false },
);

const productoSchema = new mongoose.Schema(
  {
    codigoInterno: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    referencia: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    codigoExterno: {
      type: String,
      trim: true,
      default: "",
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    categoriaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categoria",
      default: null,
    },
    subcategoriaId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    unidadMedidaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UnidadMedida",
      required: true,
    },
    valorUnitario: {
      type: Number,
      default: 0,
      min: 0,
    },
    stockMinimo: {
      type: Number,
      default: 0,
      min: 0,
    },
    stockMaximo: {
      type: Number,
      default: 0,
      min: 0,
    },
    imagen: {
      type: String,
      default: "",
    },
    presentaciones: {
      type: [presentacionSchema],
      default: [],
    },
    ubicacion: {
      rackId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rack",
        default: null,
      },
      posicion: {
        type: String,
        trim: true,
        uppercase: true,
        default: "",
      },
    },
    activo: {
      type: Boolean,
      default: true,
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

productoSchema.index({ nombre: 1 });
productoSchema.index({ categoriaId: 1 });
productoSchema.index({ referencia: 1 });
productoSchema.index({ codigoExterno: 1 });

const Producto = mongoose.model("Producto", productoSchema);
export default Producto;

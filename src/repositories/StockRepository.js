import mongoose from "mongoose";
import BaseRepository from "./BaseRepository.js";
import Stock from "../models/Stock.js";

class StockRepository extends BaseRepository {
  constructor() {
    super(Stock);
  }

  async findByProductoYSede(productoId, sedeId, opciones = {}) {
    return this.model.findOne({ productoId, sedeId }, null, opciones);
  }

  async obtenerProductoIdsPorSede(sedeId) {
    return this.model.distinct("productoId", { sedeId });
  }

  async incrementarStock(productoId, sedeId, cantidad, opciones = {}) {
    return this.model.findOneAndUpdate(
      { productoId, sedeId },
      {
        $inc: { cantidadDisponible: cantidad },
        $set: { ultimaActualizacion: new Date() },
      },
      { upsert: true, new: true, ...opciones },
    );
  }

  async decrementarStock(productoId, sedeId, cantidad, opciones = {}) {
    return this.model.findOneAndUpdate(
      { productoId, sedeId, cantidadDisponible: { $gte: cantidad } },
      {
        $inc: { cantidadDisponible: -cantidad },
        $set: { ultimaActualizacion: new Date() },
      },
      { new: true, ...opciones },
    );
  }

  async reservarStock(productoId, sedeId, cantidad, opciones = {}) {
    return this.model.findOneAndUpdate(
      { productoId, sedeId, cantidadDisponible: { $gte: cantidad } },
      {
        $inc: { cantidadDisponible: -cantidad, cantidadReservada: cantidad },
        $set: { ultimaActualizacion: new Date() },
      },
      { new: true, ...opciones },
    );
  }

  async liberarReserva(productoId, sedeId, cantidad, opciones = {}) {
    return this.model.findOneAndUpdate(
      { productoId, sedeId, cantidadReservada: { $gte: cantidad } },
      {
        $inc: { cantidadDisponible: cantidad, cantidadReservada: -cantidad },
        $set: { ultimaActualizacion: new Date() },
      },
      { new: true, ...opciones },
    );
  }

  async obtenerStockPorSede(sedeId, filtros = {}) {
    const consulta = { sedeId };
    if (filtros.productoId) consulta.productoId = filtros.productoId;
    if (filtros.productoIds?.length) consulta.productoId = { $in: filtros.productoIds };

    return this.model
      .find(consulta)
      .populate(
        "productoId",
        "nombre codigoInterno codigoExterno categoriaId stockMinimo stockMaximo",
      )
      .populate("sedeId", "nombre codigo")
      .sort({ "productoId.nombre": 1 });
  }

  async obtenerStockGlobal(filtros = {}) {
    const match = {};
    if (filtros.productoId) match.productoId = new mongoose.Types.ObjectId(filtros.productoId);
    if (filtros.productoIds?.length) {
      match.productoId = {
        $in: filtros.productoIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    return this.model.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$productoId",
          cantidadDisponibleTotal: { $sum: "$cantidadDisponible" },
          cantidadReservadaTotal: { $sum: "$cantidadReservada" },
          sedes: {
            $push: {
              sedeId: "$sedeId",
              cantidadDisponible: "$cantidadDisponible",
              cantidadReservada: "$cantidadReservada",
            },
          },
        },
      },
      {
        $lookup: {
          from: "productos",
          localField: "_id",
          foreignField: "_id",
          as: "producto",
        },
      },
      { $unwind: "$producto" },
      {
        $lookup: {
          from: "sedes",
          localField: "sedes.sedeId",
          foreignField: "_id",
          as: "sedesInfo",
        },
      },
      { $sort: { "producto.nombre": 1 } },
    ]);
  }
}

export default new StockRepository();

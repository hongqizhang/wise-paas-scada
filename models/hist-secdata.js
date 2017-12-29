'use strict';

const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let histSecDataSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId
  },
  scadaId: String,
  tagName: String,
  value: Object,
  ts: {
    type: Date,
    default: Date.now
  },
  opTS: {
    type: Date,
    default: Date.now
  }
}, { collection: 'scada_HistSecData', versionKey: false });
histSecDataSchema.index({ scadaId: 1, tagName: 1, ts: 1 }, { unique: true });
histSecDataSchema.index({ _id: 1 }, { unique: true });
mongoose.model('HistSecData', histSecDataSchema);
module.exports = mongoose.model('HistSecData');

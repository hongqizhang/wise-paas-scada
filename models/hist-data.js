'use strict';

const mongoose = require('mongoose');

let Schema = mongoose.Schema;
/* let histDataSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId
  },
  scadaId: String,
  tagName: String,
  value: Object,
  ts: {
    type: Date,
    default: Date.now
  }
}, { collection: 'SCADAHistData', versionKey: false });

histDataSchema.index({ scadaId: 1, tagName: 1, ts: 1 }, { unique: true }); */

let histDataSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId
  },
  id: String,
  tags: Object,
  ts: {
    type: Date,
    default: Date.now
  }
}, { collection: 'SCADAHistData', versionKey: false });

histDataSchema.index({ id: 1, ts: 1 }, { unique: true });

mongoose.model('HistData', histDataSchema);

module.exports = mongoose.model('HistData');

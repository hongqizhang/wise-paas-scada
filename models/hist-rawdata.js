'use strict';

const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let histDataSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId
  },
  s: String,
  d: String,
  t: String,
  v: Object,
  ts: {
    type: Date,
    default: Date.now
  }/*,
  opTS: {
    type: Date,
    default: Date.now
  } */
}, { collection: 'scada_HistRawData', versionKey: false });
histDataSchema.index({ s: 1, d: 1, t: 1, ts: 1 }, { unique: true });
histDataSchema.index({ s: 1, d: 1, t: 1, ts: -1 }, { unique: true });
histDataSchema.index({ ts: 1 }, { unique: false });

/* let subSchema = new Schema({
  name: String,
  value: Object
}, { _id: false });

let histDataSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId
  },
  id: String,
  tags: [subSchema],
  ts: {
    type: Date,
    default: Date.now
  }
}, { collection: 'SCADAHistData', versionKey: false });

histDataSchema.index({ id: 1, ts: 1 }, { unique: true });
histDataSchema.index({ id: 1, ts: 1, 'tags.name': 1 }, { unique: true }); */

mongoose.model('HistRawData', histDataSchema);
module.exports = mongoose.model('HistRawData');

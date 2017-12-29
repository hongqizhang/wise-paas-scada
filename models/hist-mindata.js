'use strict';

const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let histMinDataSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId
  },
  scadaId: String,
  tagName: String,
  sum: Object,
  len: Object,
  avg: Object,
  max: Object,
  min: Object,
  first: Object,
  last: Object,
  ts: {
    type: Date,
    default: Date.now
  }
}, { collection: 'scada_HistMinData', versionKey: false });
histMinDataSchema.index({ scadaId: 1, tagName: 1, ts: 1 }, { unique: true });
histMinDataSchema.index({ _id: 1 }, { unique: true });
mongoose.model('HistMinData', histMinDataSchema);
module.exports = mongoose.model('HistMinData');

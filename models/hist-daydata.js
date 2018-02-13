'use strict';

const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let histDayDataSchema = new Schema({
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
}, { collection: 'scada_HistDayData', versionKey: false });

histDayDataSchema.index({ scadaId: 1, tagName: 1, ts: 1 }, { unique: true });
mongoose.model('HistDayData', histDayDataSchema);
module.exports = mongoose.model('HistDayData');

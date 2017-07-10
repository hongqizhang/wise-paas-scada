'use strict';

const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let histDataSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId
  },
  id: String,
  value: Object,
  ts: {
    type: Date,
    default: Date.now
  }
}, { collection: 'SCADAHistData', versionKey: false });

histDataSchema.index({ id: 1, ts: 1 }, { unique: true });

mongoose.model('HistData', histDataSchema);

module.exports = mongoose.model('HistData');

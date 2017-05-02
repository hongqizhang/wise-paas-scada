'use strict';

const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let realData = new Schema({
  id: { type: String, schemaName: '_id' },
  value: String,
  ts: {
    type: Date,
    default: Date.now
  }
}, { collection: 'SCADARealData', versionKey: false });
mongoose.model('RealData', realData);

module.exports = mongoose.model('RealData');
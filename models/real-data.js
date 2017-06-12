'use strict';

const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let realDataSchema = new Schema({
  _id: String,
  value: Object,
  ts: {
    type: Date,
    default: Date.now
  }
}, { collection: 'SCADARealData', versionKey: false });

mongoose.model('RealData', realDataSchema);

module.exports = mongoose.model('RealData');

'use strict';

const mongoose = require('mongoose');

let Schema = mongoose.Schema;
/* let subSchema = new Schema({
  name: String,
  value: Object,
  ts: {
    type: Date,
    default: Date.now
  },
  opTS: {
    type: Date,
    default: Date.now
  }
}, { _id: false }); */
let realDataSchema = new Schema({
  _id: String,
  tags: Object
}, { collection: 'SCADARealData', versionKey: false });

mongoose.model('RealData', realDataSchema);

module.exports = mongoose.model('RealData');

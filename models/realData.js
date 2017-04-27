'use strict';

const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let realData = new Schema({
  _id: String,
  value: String,
  ts: {
    type: Date,
    default: Date.now
  }
}, { collection: 'SCADARealData', versionKey: false });
mongoose.model('RealData', realData);

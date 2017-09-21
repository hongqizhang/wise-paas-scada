'use strict';

const mongoose = require('mongoose');

const defaultHbtFreq = 5;

let Schema = mongoose.Schema;
let deviceStatusSchema = new Schema({
  _id: String,   // scadaId or deviceId
  status: {
    type: Boolean,
    default: false
  },
  modified: {
    type: Boolean,
    default: false
  },
  ts: {
    type: Date,
    default: Date.now
  }
}, { collection: 'scada_DeviceStatus', versionKey: false });
mongoose.model('DeviceStatus', deviceStatusSchema);

module.exports = mongoose.model('DeviceStatus');

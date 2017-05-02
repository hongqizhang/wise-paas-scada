'use strict';

const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let deviceStatus = new Schema({
  _id: String,   // scadaId or deviceId
  status: Boolean,
  freq: Number,
  ts: {
    type: Date,
    default: Date.now
  }
}, { collection: 'SCADADeviceStatus', versionKey: false });
mongoose.model('DeviceStatus', deviceStatus);

module.exports = mongoose.model('DeviceStatus');

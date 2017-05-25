'use strict';

const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let deviceStatusSchema = new Schema({
  _id: String,   // scadaId or deviceId
  status: Boolean,
  freq: Number,
  ts: {
    type: Date,
    default: Date.now
  }
}, { collection: 'SCADADeviceStatus', versionKey: false });
mongoose.model('DeviceStatus', deviceStatusSchema);

module.exports = mongoose.model('DeviceStatus');

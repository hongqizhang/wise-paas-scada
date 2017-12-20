'use strict';

const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let subSchema = new Schema({
  d: String,
  status: {
    type: Boolean,
    default: false
  },
  ts: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

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
  },
  devices: [subSchema]
}, { collection: 'scada_DeviceStatus', versionKey: false });
mongoose.model('DeviceStatus', deviceStatusSchema);

module.exports = mongoose.model('DeviceStatus');

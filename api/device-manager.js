'use strict';

const util = require('util');

const mongodb = require('../db/mongodb.js');
const DeviceStatus = require('../models/device-status.js');

module.exports.init = (conf) => {
  if (mongodb && mongodb.isConnected() === false) {
    mongodb.connect(conf);
  }
};

module.exports.quit = () => {
  if (mongodb && mongodb.isConnected()) {
    mongodb.disconnect();
  }
};

module.exports.getDeviceStatus = (id, callback) => {
  if (mongodb) {
    DeviceStatus.findOne({ _id: id }, function (err, result) {
      if (err) {
        console.error(err);
        callback(err);
      } else {
        callback(null, result);
      }
    });
  }
};

module.exports.updateDeviceStatus = (id, status, callback) => {
  if (mongodb) {
    DeviceStatus.update({ _id: id }, { status: status, ts: new Date() }, { upsert: false }, function (err, result) {
      if (err) {
        callback(err);
      }
      callback(null, result);
    });
  }
};

module.exports.upsertDeviceInfo = (id, params, callback) => {
  if (mongodb) {
    DeviceStatus.update({ _id: id }, { _id: id, status: params.status, freq: params.freq, ts: new Date() }, { upsert: true }, function (err, result) {
      if (err) {
        callback(err);
      }
      callback(null, result);
    });
  }
};

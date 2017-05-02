'use strict';

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
    DeviceStatus.findOne({ id: id }, function (err, result) {
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
    DeviceStatus.update({ id: id }, { status: status, ts: new Date() }, { upsert: false }, function (err, result) {
      if (err) {
        callback(err);
      }
      let response = { ok: false };
      if (result && result.n) {
        response.ok = (result.n === 1);
      }
      callback(null, response);
    });
  }
};

module.exports.upsertDeviceInfo = (id, params, callback) => {
  if (mongodb) {
    DeviceStatus.update({ id: id }, { id: id, status: params.status, freq: params.freq, ts: new Date() }, { upsert: true }, function (err, result) {
      if (err) {
        callback(err);
      }
      let response = { ok: false };
      if (result && result.n) {
        response.ok = (result.n === 1);
      }
      callback(null, response);
    });
  }
};

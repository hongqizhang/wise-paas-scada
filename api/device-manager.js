'use strict';

const mongodb = require('../db/mongodb.js');
const DeviceStatus = require('../models/device-status.js');

module.exports.init = (conf) => {
  if (mongodb && mongodb.isConnected() === false && mongodb.isConnecting() === false) {
    mongodb.connect(conf);
  }
};

module.exports.quit = () => {
  if (mongodb && mongodb.isConnected()) {
    mongodb.disconnect();
  }
};

module.exports.getDeviceStatus = (id, callback) => {
  DeviceStatus.findOne({ _id: id }, function (err, result) {
    if (err) {
      callback(err);
      return;
    }
    let response = {
      id: id,
      status: (result) ? result.status : false
    };
    callback(null, response);
  });
};

module.exports.updateDeviceStatus = (id, status, callback) => {
  DeviceStatus.update({ _id: id }, { status: status, ts: new Date() }, { upsert: false }, function (err, result) {
    if (err) {
      callback(err);
      return;
    }
    let response = { ok: false };
    if (result && result.n) {
      response.ok = (result.n === 1);
    }
    callback(null, response);
  });
};

module.exports.upsertDeviceInfo = (id, params, callback) => {
  DeviceStatus.update({ _id: id }, { _id: id, status: params.status, freq: params.freq, ts: new Date() }, { upsert: true }, function (err, result) {
    if (err) {
      callback(err);
      return;
    }
    let response = { ok: false };
    if (result && result.n) {
      response.ok = (result.n === 1);
    }
    callback(null, response);
  });
};

module.exports.deleteDeviceInfo = (id, callback) => {
  if (!id) {
    let err = 'id can not be null !';
    callback(err);
    return;
  }
  DeviceStatus.remove({ _id: id }, function (err, result) {
    if (err) {
      callback(err);
      return;
    }
    let response = { ok: false };
    if (result && result.result && result.result.n) {
      response.ok = (result.n > 0);
    }
    callback(null, response);
  });
};

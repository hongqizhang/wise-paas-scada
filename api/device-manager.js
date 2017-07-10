'use strict';

const Promise = require('promise');

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

function _getDeviceStatus (id) {
  return new Promise((resolve, reject) => {
    DeviceStatus.findOne({ _id: id }, function (err, result) {
      if (err) {
        reject(err);
        return;
      }
      let response = {
        id: id,
        status: (result && typeof result.status !== 'undefined') ? result.status : false,
        modified: (result && typeof result.modified !== 'undefined') ? result.modified : false,
        ts: (result) ? result.ts : new Date()
      };
      resolve(response);
    });
  });
}

module.exports.getDeviceStatus = (ids, callback) => {
  try {
    if (Array.isArray(ids)) {
      let promises = [];
      for (var i = 0; i < ids.length; i++) {
        promises.push(_getDeviceStatus.call(this, ids[i]));
      }
      Promise.all(promises)
      .then(function (results) {
        callback(null, results);
      })
      .catch(function (err) {
        callback(err);
      });
    } else {
      _getDeviceStatus.call(this, ids)
      .then(function (result) {
        callback(null, result);
      })
      .catch(function (err) {
        callback(err);
      });
    }
  } catch (err) {
    callback(err);
  }
};

module.exports.updateDeviceStatus = (id, status, ts, callback) => {
  DeviceStatus.update({ _id: id }, { status: status, ts: ts || new Date() }, { upsert: false }, function (err, result) {
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

module.exports.updateModifiedStatus = (id, modified, callback) => {
  DeviceStatus.update({ _id: id }, { modified: modified }, { upsert: false }, function (err, result) {
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
  DeviceStatus.update({ _id: id }, {
    _id: id,
    status: params.status || false,
    freq: params.freq,
    modified: params.modified || false,
    ts: params.ts || new Date()
  }, { upsert: true }, function (err, result) {
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

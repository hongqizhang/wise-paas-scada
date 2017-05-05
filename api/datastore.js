'use strict';

const util = require('util');

const mongodb = require('../db/mongodb.js');
const RealData = require('../models/real-data.js');

module.exports.init = (conf) => {
  if (mongodb && mongodb.isConnected() === false && mongodb.isConnecting() === false) {
    mongodb.connect(conf);
  }
};

module.exports.quit = () => {
  if (mongodb) {
    mongodb.disconnect();
  }
};

module.exports.getRealData = (params, callback) => {
  let id = util.format('%s/%s/%s', params.scadaId, params.deviceId, params.tagName);
  RealData.findOne({ _id: id }, function (err, result) {
    if (err) {
      callback(err);
      return;
    }
    let response = {
      scadaId: params.scadaId,
      deviceId: params.deviceId,
      tagName: params.tagName,
      value: (result && result.value) ? result.value : '*',
      ts: (result && result.ts) ? result.ts : new Date()
    };

    callback(null, response);
  });
};

module.exports.upsertRealData = (params, callback) => {
  if (!params.value) {
    let err = 'value can not be null !';
    callback(err);
    return;
  }

  let id = util.format('%s/%s/%s', params.scadaId, params.deviceId, params.tagName);
  RealData.update({ _id: id }, { id: id, value: params.value, ts: new Date() }, { upsert: true }, function (err, result) {
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

module.exports.updateRealData = (params, callback) => {
  if (!params.value) {
    let err = 'value can not be null !';
    callback(err);
    return;
  }

  if (mongodb && mongodb.isConnected()) {
    let id = util.format('%s/%s/%s', params.scadaId, params.deviceId, params.tagName);
    RealData.update({ _id: id }, { value: params.value, ts: new Date() }, { upsert: false }, function (err, result) {
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
  }
};

module.exports.deleteRealDataByScadaId = (scadaId, callback) => {
  if (!scadaId) {
    let err = 'scadaId can not be null !';
    callback(err);
    return;
  }
  let regex = new RegExp('^' + scadaId, 'i');
  RealData.remove({ _id: { $regex: regex } }, function (err, result) {
    if (err) {
      callback(err);
      return;
    }
    let response = { ok: false };
    if (result && result.n) {
      response.ok = (result.n > 0);
    }
    callback(null, response);
  });
};

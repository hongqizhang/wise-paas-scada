'use strict';

const util = require('util');

const mongodb = require('../db/mongodb.js');
const RealData = require('../models/real-data.js');

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

module.exports.getRealData = (params, callback) => {
  if (mongodb) {
    let id = util.format('%s/%s/%s', params.scadaId, params.deviceId, params.tagName);
    RealData.findOne({ id: id }, function (err, result) {
      if (err) {
        console.error(err);
        callback(err);
      } else {
        if (result) {
          params.value = result.value;
          params.ts = result.ts;
        }
        callback(null, params);
      }
    });
  }
};

module.exports.upsertRealData = (params, callback) => {
  if (mongodb) {
    let id = util.format('%s/%s/%s', params.scadaId, params.deviceId, params.tagName);
    RealData.update({ id: id }, { id: id, value: params.value, ts: new Date() }, { upsert: true }, function (err, result) {
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

module.exports.updateRealData = (params, callback) => {
  if (mongodb) {
    let id = util.format('%s/%s/%s', params.scadaId, params.deviceId, params.tagName);
    RealData.update({ id: id }, { value: params.value, ts: new Date() }, { upsert: false }, function (err, result) {
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

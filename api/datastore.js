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
    RealData.findOne({ _id: id }, function (err, result) {
      if (err) {
        console.error(err);
        callback(err);
      } else {
        callback(null, result);
      }
    });
  }
};

module.exports.upsertRealData = (params, callback) => {
  if (mongodb) {
    let id = util.format('%s/%s/%s', params.scadaId, params.deviceId, params.tagName);
    RealData.update({ _id: id }, { _id: id, value: params.value, ts: new Date() }, { upsert: true }, function (err, result) {
      if (err) {
        callback(err);
      }
      callback(null, result);
    });
  }
};

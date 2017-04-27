'use strict';

const util = require('util');
const mongoose = require('mongoose');

const realData = require('../models/realData.js');

let RealData = mongoose.model('RealData');

function _connect (conf) {
  if (!conf) {
    console.error('[mongodb] no config !');
  }

  mongoose.connect(util.format('mongodb://%s:%s@%s:%d/%s',
    conf.username, conf.password, conf.hostname, conf.port, conf.database), (err) => {
    if (err) {
      console.error('[mongodb] ' + err);
    } else {
      console.log('[mongodb] connected !');
      mongoose.connection.on('disconnected', function () {
        console.log('[mongodb] disconnected !');
      });
    }
  });
}

function _disconnect () {
  mongoose.disconnect();
}

function _findOneRealData (params, callback) {
  if (params) {
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
}

module.exports.connect = _connect;
module.exports.disconnect = _disconnect;
module.exports.findOneRealData = _findOneRealData;

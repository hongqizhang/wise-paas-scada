'use strict';

const util = require('util');
const mongoose = require('mongoose');
const Promise = require('promise');

function _connect (conf) {
  if (!conf) {
    console.error('[mongodb] no config !');
  }

  mongoose.connect(util.format('mongodb://%s:%s@%s:%d/%s',
    conf.username, conf.password, conf.hostname, conf.port, conf.database), (err) => {
    if (err) {
      console.error('[mongodb] ' + err);
    } else {
      mongoose.Promise = Promise;
      mongoose.connection.on('connected', function () {
        console.log('[mongodb] connected !');
      });
      mongoose.connection.on('disconnected', function () {
        console.log('[mongodb] disconnected !');
      });
    }
  });
}

function _disconnect () {
  mongoose.disconnect();
}

function _isConnected () {
  if (mongoose && mongoose.connection && mongoose.connection.readyState === 1) {
    return true;
  } else {
    return false;
  }
}

function _isConnecting () {
  if (mongoose && mongoose.connection && mongoose.connection.readyState === 2) {
    return true;
  } else {
    return false;
  }
}

module.exports.ObjectId = mongoose.Types.ObjectId;
module.exports.connect = _connect;
module.exports.disconnect = _disconnect;
module.exports.isConnected = _isConnected;
module.exports.isConnecting = _isConnecting;

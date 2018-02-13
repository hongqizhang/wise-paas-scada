'use strict';

const util = require('util');
const mongoose = require('mongoose');
const Promise = require('bluebird');

function _connect (conf) {
  if (!conf || Object.keys(conf).length === 0) {
    return console.error('[mongodb] no config !');
  }
  let options = {
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
    bufferMaxEntries: 0,
    poolSize: 5,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000
    /* replicaSet: 'rs0' 預設default執會導致local測試失敗 */
  };

  if (conf.replicaSetName) {
    options.replicaSet = conf.replicaSetName;
  }

  mongoose.connect(conf.uri, options);

  mongoose.Promise = Promise;
  let db = mongoose.connection;
  // db.once('open', () => { console.log('[mongodb] open success !'); });
  db.on('error', (err) => {
    console.error('[mongodb] Error ! ');
    if (err && err.message) {
      console.error(err.message);
    }
  });
  db.on('connected', () => {
    console.log('[mongodb] Connect success !');
  });
  db.on('disconnected', () => {
    console.log('[mongodb] Disconnected !');
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

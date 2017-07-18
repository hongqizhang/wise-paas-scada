'use strict';

const util = require('util');
const mongoose = require('mongoose');
const Promise = require('bluebird');

function _connect (conf) {
  if (!conf) {
    console.error('[mongodb] no config !');
    return;
  }

  let options = {
    db: { native_parser: true },
    server: {
      auto_reconnect: true,
      poolSize: 5,
      socketOptions: {
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000
      }
    }
  };
  mongoose.connect(util.format('mongodb://%s:%s@%s:%d/%s',
    conf.username, conf.password, conf.hostname, conf.port, conf.database), options);

  mongoose.Promise = Promise;
  let db = mongoose.connection;
  db.once('open', () => { console.log('[mongodb] Connect success !'); });
  db.on('error', (err) => { console.error('[mongodb] Connect error ! ' + err); });
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

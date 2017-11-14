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
    useMongoClient: true,
    autoReconnect: true,
    poolSize: 5,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000
  };
  mongoose.connect(util.format('mongodb://%s:%s@%s:%d/%s',
    conf.username, conf.password, conf.hostname, conf.port, conf.database), options);

  mongoose.Promise = Promise;
  let db = mongoose.connection;
  // db.once('open', () => { console.log('[mongodb] open success !'); });
  db.on('error', (err) => {
    console.error('[mongodb] Connect error ! ');
    if (err && err.message) {
      console.error(err.message);
    }
  });
  db.on('connected', () => {
    console.log('[mongodb] Connect success !');
  });
  db.on('disconnected', () => {
    console.log('[mongodb] Disconnected ! Try to connect...');
    setTimeout(() => {
      mongoose.connect(util.format('mongodb://%s:%s@%s:%d/%s',
      conf.username, conf.password, conf.hostname, conf.port, conf.database), options)
      .catch((err) => {
        console.error(err.message);
      });
    }, 3000);
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

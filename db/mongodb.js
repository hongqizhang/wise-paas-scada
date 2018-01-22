'use strict';

const util = require('util');
const mongoose = require('mongoose');
const Promise = require('bluebird');

function _connect (conf) {
  if (!conf) {
    return console.error('[mongodb] no config !');
  }

  let options = {
    useMongoClient: true,
    autoReconnect: false,
    poolSize: 5,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000
  };

  let addrs = [];
  addrs.push(util.format('%s:%d', conf.host, conf.port));
  if (conf.replicaSet) {
    if (Array.isArray(conf.replicaSet)) {
      for (let i = 0; i < conf.replicaSet.length; i++) {
        addrs.push(util.format('%s:%d', conf.replicaSet[i].host, conf.replicaSet[i].port));
      }
    } else if (typeof conf.replicaSet === 'object') {
      addrs.push(util.format('%s:%d', conf.replicaSet.host, conf.replicaSet.port));
    }
  }
  mongoose.connect(util.format('mongodb://%s:%s@%s/%s',
    conf.username, conf.password, addrs.join(','), conf.database), options);

  mongoose.Promise = Promise;
  let db = mongoose.connection;
  // db.once('open', () => { console.log('[mongodb] open success !'); });
  db.on('error', (err) => {
    console.error('[mongodb] Error ! ');
    if (err && err.message) {
      console.error(err.message);
    }
    // _disconnect();
  });
  db.on('connected', () => {
    console.log('[mongodb] Connect success !');
  });
  db.on('disconnected', () => {
    setTimeout(() => {
      _reconnect(conf, options);
    }, 3000);
  });
}

function _disconnect () {
  mongoose.disconnect();
}

function _reconnect (conf, options) {
  console.log('[mongodb] Disconnected ! Try to connect...');
  mongoose.connect(util.format('mongodb://%s:%s@%s:%d/%s',
    conf.username, conf.password, conf.host, conf.port, conf.database), options)
  .catch((err) => {
    console.error(err.message);
  });
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

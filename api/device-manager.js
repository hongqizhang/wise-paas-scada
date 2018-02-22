'use strict';

const Promise = require('bluebird');

const mongodb = require('../db/mongodb.js');
// const waamqp = require('../communication/waamqp.js');
const wamqtt = require('../communication/wamqtt.js');
const statusFactory = require('../factory/statusFactory');

let statusHelper = null;
let constant = require('../common/const');

function _init (options) {
  try {
    if (!options) {
      return;
    }

    let mongoConf = options.mongoConf;
    let mqttConf = options.mqttConf;
    statusHelper = statusFactory.createStatusHelper(constant.databaseType.mongodb);

    if (mongoConf) {
      if (mongodb && mongodb.isConnected() === false && mongodb.isConnecting() === false) {
        mongodb.connect(mongoConf);
      }
    }
    if (mqttConf) {
      if (wamqtt && wamqtt.isConnected() === false && wamqtt.isConnecting() === false) {
        wamqtt.connect(mqttConf);
        wamqtt.events.on('connect', () => {
          console.log('[wamqtt] Connect success !');
        });
        wamqtt.events.on('close', () => {
          console.log('[wamqtt] connection close...');
        });
        wamqtt.events.on('offline', () => {
          console.log('[wamqtt] Connect offline !');
        });
        wamqtt.events.on('error', (error) => {
          console.error('[wamqtt] something is wrong ! ' + error);
        });
        wamqtt.events.on('reconnect', () => {
          console.log('[wamqtt] try to reconnect...');
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function _quit () {
  if (mongodb && mongodb.isConnected()) {
    mongodb.disconnect();
  }
  if (wamqtt) {
    wamqtt.close();
  }
}

function _getDeviceStatus (params, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    try {
      if (!Array.isArray(params)) {
        params = [params];
      }
      statusHelper.getDeviceStatus(params).then((response) => {
        resolve(response);
        callback(null, response);
      }).catch((err) => {
        reject(err);
        callback(err);
      });
    } catch (err) {
      reject(err);
      callback(err);
    }
  });
}

function _upsertDeviceStatus (scadaId, deviceId, param, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    if (typeof param.ts === 'string') {
      param.ts = new Date(param.ts);
    }
    statusHelper.upsertDeviceStatus(scadaId, deviceId, param).then((result) => {
      resolve(result);
      callback(null, result);
    }).catch((err) => {
      reject(err);
      callback(err);
    });
  });
}

function _deleteDeviceStatus (scadaId, deviceId, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    if (!scadaId) {
      let err = new Error('scadaId can not be null !');
      reject(err);
      return callback(err);
    }
    if (!deviceId) {
      let err = new Error('deviceId can not be null !');
      reject(err);
      return callback(err);
    }
    statusHelper.deleteDeviceStatus(scadaId, deviceId).then((result) => {
      resolve(result);
      callback(null, result);
    }).catch((err) => {
      reject(err);
      callback(err);
    });
  });
}

module.exports = {
  init: _init,
  quit: _quit,
  getDeviceStatus: _getDeviceStatus,
  upsertDeviceStatus: _upsertDeviceStatus,
  deleteDeviceStatus: _deleteDeviceStatus
};

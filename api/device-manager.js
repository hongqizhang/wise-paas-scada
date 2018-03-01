'use strict';

const Promise = require('bluebird');

const mongodb = require('../db/mongodb.js');
const DeviceStatus = require('../models/device-status.js');
// const waamqp = require('../communication/waamqp.js');
const wamqtt = require('../communication/wamqtt.js');

function __upsertDeviceStatus (param) {
  return new Promise((resolve, reject) => {
    let id = param.scadaId + '/' + param.deviceId;
    DeviceStatus.update({ _id: id }, {
      _id: id,
      status: param.status || false,
      modified: param.modified || false,
      ts: param.ts || new Date()
    }, { upsert: true }, (err, result) => {
      if (err) {
        reject(err);
      }
      let response = { ok: false };
      if (result && result.n) {
        response.ok = (result.n > 0);
      }
      resolve(response);
    });
  });
}

function _init (mongoConf, mqttConf) {
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
      let ids = [];
      for (let i = 0; i < params.length; i++) {
        let param = params[i];
        if (!param.scadaId) {
          let err = new Error('scadaId can not be null !');
          reject(err);
          return callback(err);
        }
        if (!param.deviceId) {
          let err = new Error('deviceId can not be null !');
          reject(err);
          return callback(err);
        }
        ids.push(param.scadaId + '/' + param.deviceId);
      }
      DeviceStatus.find({ _id: { $in: ids } }, (err, results) => {
        if (err) {
          reject(err);
          return callback(err);
        }
        let response = [];
        for (let i = 0; i < params.length; i++) {
          let param = params[i];
          let result = results.find(d => d._id === param.scadaId + '/' + param.deviceId);
          let scada = {
            scadaId: param.scadaId,
            deviceId: param.deviceId,
            status: (result && result.status !== undefined) ? result.status : false,
            modified: (result && result.modified !== undefined) ? result.modified : false,
            ts: (result) ? result.ts : new Date()
          };
          response.push(scada);
        }
        resolve(response);
        callback(null, response);
      });
    } catch (err) {
      reject(err);
      callback(err);
    }
  });
}

function _upsertDeviceStatus (params, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    let promises = [];
    if (!Array.isArray(params)) {
      params = [params];
    }
    for (let i = 0; i < params.length; i++) {
      promises.push(__upsertDeviceStatus(params[i]));
    }
    Promise.all(promises)
      .then((results) => {
        resolve(results);
        callback(null, results);
      })
      .catch((err) => {
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
    DeviceStatus.update({ _id: scadaId }, { $pull: { devices: { d: deviceId } } }, (err, result) => {
      if (err) {
        reject(err);
        return callback(err);
      }
      let response = { ok: false };
      if (result && result.n) {
        response.ok = (result.n > 0);
      }
      resolve(response);
      callback(null, response);
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

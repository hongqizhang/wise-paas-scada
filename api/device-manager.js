'use strict';

const Promise = require('bluebird');

const mongodb = require('../db/mongodb.js');
const DeviceStatus = require('../models/device-status.js');
// const waamqp = require('../communication/waamqp.js');
const wamqtt = require('../communication/wamqtt.js');

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

function _getDeviceStatus (param, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    try {
      let params = [];
      if (Array.isArray(param)) {
        params = param;
      } else {
        params.push(param);
      }
      let condition = { $or: [] };
      for (let i = 0; i < params.length; i++) {
        condition['$or'].push({ _id: params[i].scadaId, 'devices.d': params[i].deviceId });
      }

      DeviceStatus.find(condition, (err, results) => {
        if (err) {
          reject(err);
          return callback(err);
        }
        let response = [];
        for (let i = 0; i < params.length; i++) {
          let param = params[i];
          let obj = {
            scadaId: param.scadaId,
            deviceId: param.deviceId,
            status: false,
            ts: new Date()
          };
          let scada = results.find(s => s._id === param.scadaId);
          if (scada) {
            let device = scada.devices.find(d => d.d === param.deviceId);
            if (device) {
              obj.status = (device.status !== undefined) ? device.status : false;
              obj.ts = (device.ts !== undefined) ? device.ts : new Date();
            }
          }
          response.push(obj);
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

function _upsertDeviceStatus (scadaId, deviceId, param, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    if (typeof param.ts === 'string') {
      param.ts = new Date(param.ts);
    }
    DeviceStatus.findOneAndUpdate({ _id: scadaId }, { $setOnInsert: { devices: [] } }, { upsert: true, new: true }, (err, doc) => {
      if (err) {
        reject(err);
        return callback(err);
      }
      if (typeof param.ts === 'string') {
        param.ts = new Date(param.ts);
      }
      let device = doc.devices.find(d => d.d === deviceId);
      if (device) {
        device.status = param.status || false;
        device.ts = param.ts || new Date();
      } else {
        doc.devices.push({
          d: deviceId,
          status: param.status || false,
          ts: param.ts || new Date()
        });
      }
      DeviceStatus.collection.save(doc)
        .then(() => {
          let response = { ok: true };
          resolve(response);
          callback(null, response);
        }).catch((err) => {
          reject(err);
          callback(err);
        });
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

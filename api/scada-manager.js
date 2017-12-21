'use strict';

const Promise = require('bluebird');

const mongodb = require('../db/mongodb.js');
const DeviceStatus = require('../models/device-status.js');
// const waamqp = require('../communication/waamqp.js');
const wamqtt = require('../communication/wamqtt.js');
const cfgRecHelper = require('../utils/cfgRecHelper.js');

const defaultHbtFreq = 5;

function __updateModifiedStatus (id, modified, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    DeviceStatus.update({ _id: id }, { modified: modified }, { upsert: false }, (err, result) => {
      if (err) {
        reject(err);
        return callback(err);
      }
      let response = { ok: false };
      if (result && result.n) {
        response.ok = (result.n === 1);
      }
      resolve(response);
      callback(null, response);
    });
  });
}

function _init (mongoConf, mqttConf) {
  if (mongodb && mongodb.isConnected() === false && mongodb.isConnecting() === false) {
    mongodb.connect(mongoConf);
  }
  if (wamqtt) {
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

function _getScadaStatus (ids, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    try {
      let sIds = [];
      if (Array.isArray(ids)) {
        sIds = ids;
      } else {
        sIds.push(ids);
      }
      DeviceStatus.find({ _id: { $in: sIds } }, (err, results) => {
        if (err) {
          reject(err);
          return callback(err);
        }
        let response = [];
        for (let i = 0; i < sIds.length; i++) {
          let id = sIds[i];
          let result = results.find(d => d._id === id);
          let scada = {
            id: id,
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

function _updateScadaStatus (id, param, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    let set = {};
    for (let key in param) {
      set[key] = param[key];
    }
    set.ts = param.ts || new Date();
    DeviceStatus.update({ _id: id }, set, (err, result) => {
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

function _upsertScadaStatus (id, params, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    DeviceStatus.update({ _id: id }, {
      _id: id,
      status: params.status || false,
      freq: params.freq || defaultHbtFreq,
      modified: params.modified || false,
      ts: params.ts || new Date(),
      devices: []
    }, { upsert: true }, (err, result) => {
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

function _deleteScadaStatus (id, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    if (!id) {
      let err = 'id can not be null !';
      reject(err);
      return callback(err);
    }
    DeviceStatus.remove({ _id: id }, (err, result) => {
      if (err) {
        reject(err);
        return callback(err);
      }
      let response = { ok: false };
      if (result && result.result && result.result.n) {
        response.ok = (result.result.n > 0);
      }
      resolve(response);
      callback(null, response);
    });
  });
}

function _addModifiedConfigRecord (id, record, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    try {
      if (!id) {
        let err = new Error('id can not be null !');
        reject(err);
        return callback(err);
      }
      /* if (!record) {
        let err = new Error('record can not be null !');
        reject(err);
        return callback(err);
      } */

      cfgRecHelper.addModifiedConfigRecord(id, record, (err, result) => {
        if (err) {
          reject(err);
          return callback(err);
        }
        _updateScadaStatus(id, { modified: true }, (err, result) => {
          if (err) {
            reject(err);
            return callback(err);
          }
          resolve(result);
          return callback(null, result);
        });
      });
    } catch (err) {
      reject(err);
      callback(err);
    }
  });
}

function _syncScadaConfig (ids, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    if (Array.isArray(ids) === false) {
      let err = new Error('iput type must be array !');
      reject(err);
      return callback(err);
    }
    if (ids.length === 0) {
      let err = new Error('input needs at least one id !');
      reject(err);
      return callback(err);
    }
    cfgRecHelper.syncDeviceConfig(ids, (err, results) => {
      if (err) {
        reject(err);
        return callback(err);
      }
      // set modified status to false
      let promises = [];
      for (let i = 0; i < ids.length; i++) {
        if (results[i].ok === true) {
          promises.push(__updateModifiedStatus(ids[i], false));
        }
      }
      Promise.all(promises)
        .then(() => {
          resolve(results);
          callback(null, results);
        })
        .catch((err) => {
          reject(err);
          callback(err);
        });
    });
  });
}

module.exports = {
  init: _init,
  quit: _quit,
  getScadaStatus: _getScadaStatus,
  updateScadaStatus: _updateScadaStatus,
  upsertScadaStatus: _upsertScadaStatus,
  deleteScadaStatus: _deleteScadaStatus,
  addModifiedConfigRecord: _addModifiedConfigRecord,
  syncScadaConfig: _syncScadaConfig
};

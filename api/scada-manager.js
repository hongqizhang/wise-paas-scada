'use strict';

const Promise = require('bluebird');

const mongodb = require('../db/mongodb.js');
// const waamqp = require('../communication/waamqp.js');
const wamqtt = require('../communication/wamqtt.js');
const cfgRecHelper = require('../utils/cfgRecHelper.js');
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

function _getScadaStatus (ids, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    try {
      if (!Array.isArray(ids)) {
        ids = [ids];
      }
      statusHelper.getScadaStatus(ids).then((results) => {
        resolve(results);
        callback(null, results);
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

function _updateScadaStatus (id, param, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    try {
      param.ts = param.ts || new Date();
      statusHelper.updateScadaStatus(id, param).then((results) => {
        resolve(results);
        callback(null, results);
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

function _upsertScadaStatus (params, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    try {
      if (!Array.isArray(params)) {
        params = [params];
      }
      statusHelper.upsertScadaStatus(params)
      .then((results) => {
        resolve(results);
        callback(null, results);
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

function _deleteScadaStatus (id, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    if (!id) {
      let err = 'id can not be null !';
      reject(err);
      return callback(err);
    }
    statusHelper.deleteScadaStatus(id).then((result) => {
      resolve(result);
      callback(null, result);
    }).catch((err) => {
      reject(err);
      callback(err);
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
        statusHelper.updateScadaStatus(id, { modified: true }).then((result) => {
          resolve(result);
          callback(null, result);
        }).catch((err) => {
          reject(err);
          callback(err);
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
    if (!Array.isArray(ids)) {
      ids = [ids];
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
          promises.push(statusHelper.updateModifiedStatus(ids[i], false));
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

'use strict';

const Promise = require('bluebird');

const mongodb = require('../db/mongodb.js');
const DeviceStatus = require('../models/device-status.js');
// const waamqp = require('../communication/waamqp.js');
const wamqtt = require('../communication/wamqtt.js');
const cfgRecHelper = require('../utils/cfgRecHelper.js');

const defaultHbtFreq = 5;

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

function _getSingleDeviceStatus (id) {
  return new Promise((resolve, reject) => {
    DeviceStatus.findOne({ _id: id }, function (err, result) {
      if (err) {
        reject(err);
      } else {
        let response = {
          id: id,
          status: (result && typeof result.status !== 'undefined') ? result.status : false,
          modified: (result && typeof result.modified !== 'undefined') ? result.modified : false,
          ts: (result) ? result.ts : new Date()
        };
        resolve(response);
      }
    });
  });
}

function _getDeviceStatus (ids, callback) {
  try {
    if (Array.isArray(ids)) {
      let promises = [];
      for (var i = 0; i < ids.length; i++) {
        promises.push(_getSingleDeviceStatus.call(this, ids[i]));
      }
      Promise.all(promises)
      .then(function (results) {
        callback(null, results);
      })
      .catch(function (err) {
        callback(err);
      });
    } else {
      _getSingleDeviceStatus.call(this, ids)
      .then(function (result) {
        callback(null, result);
      })
      .catch(function (err) {
        callback(err);
      });
    }
  } catch (err) {
    callback(err);
  }
}

function _updateModifiedStatus (id, modified, callback) {
  if (callback === null || typeof callback === 'undefined') {
    return new Promise((resolve, reject) => {
      DeviceStatus.update({ _id: id }, { modified: modified }, { upsert: false }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          let response = { ok: false };
          if (result && result.n) {
            response.ok = (result.n === 1);
          }
          resolve(response);
        }
      });
    });
  } else {
    DeviceStatus.update({ _id: id }, { modified: modified }, { upsert: false }, (err, result) => {
      if (err) {
        return callback(err);
      }
      let response = { ok: false };
      if (result && result.n) {
        response.ok = (result.n === 1);
      }
      callback(null, response);
    });
  }
}

function _insertDeviceStatus (params, callback) {
  DeviceStatus.create(params, function (err, result) {
    if (err) {
      callback(err);
      return;
    }
    let response = { ok: (result !== null) };
    callback(null, response);
  });
}

function _upsertDeviceStatus (id, params, callback) {
  DeviceStatus.update({ _id: id }, {
    _id: id,
    status: params.status || false,
    freq: params.freq || defaultHbtFreq,
    modified: params.modified || false,
    ts: params.ts || new Date()
  }, { upsert: true }, function (err, result) {
    if (err) {
      callback(err);
      return;
    }
    let response = { ok: false };
    if (result && result.n) {
      response.ok = (result.n > 0);
    }
    callback(null, response);
  });
}

function _deleteDeviceStatus (id, callback) {
  if (!id) {
    let err = 'id can not be null !';
    return callback(err);
  }
  DeviceStatus.remove({ _id: id }, function (err, result) {
    if (err) {
      callback(err);
      return;
    }
    let response = { ok: false };
    if (result && result.result && result.result.n) {
      response.ok = (result.n > 0);
    }
    callback(null, response);
  });
}

function _addModifiedConfigRecord (id, record, callback) {
  try {
    if (!id) {
      let err = 'id can not be null !';
      return callback(err);
    }
    if (!record) {
      let err = 'record can not be null !';
      return callback(err);
    }

    cfgRecHelper.addModifiedConfigRecord(id, record, (err, result) => {
      if (err) {
        return callback(err);
      }
      _upsertDeviceStatus(id, { modified: true }, (err, result) => {
        return callback(err, result);
      });
    });
  } catch (err) {
    callback(err);
  }
}

function _syncDeviceConfig (ids, callback) {
  if (Array.isArray(ids) === false) {
    let err = 'iput type must be array !';
    return callback(err);
  }
  if (ids.length === 0) {
    let err = 'input needs at least one id !';
    return callback(err);
  }
  cfgRecHelper.syncDeviceConfig(ids, (err, results) => {
    if (err) {
      return callback(err);
    }
    // set modified status to false
    let promises = [];
    for (let i = 0; i < ids.length; i++) {
      if (results[i] === true) {
        promises.push(_updateModifiedStatus(ids[i]));
      }
    }
    Promise.all(promises)
    .then(function () {
      callback(null, results);
    })
    .catch(function (err) {
      callback(err);
    });
  });
}

module.exports = {
  init: _init,
  quit: _quit,
  getDeviceStatus: _getDeviceStatus,
  insertDeviceStatus: _insertDeviceStatus,
  upsertDeviceStatus: _upsertDeviceStatus,
  deleteDeviceStatus: _deleteDeviceStatus,
  addModifiedConfigRecord: _addModifiedConfigRecord,
  syncDeviceConfig: _syncDeviceConfig
};

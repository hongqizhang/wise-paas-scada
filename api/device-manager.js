'use strict';

const Promise = require('bluebird');

const mongodb = require('../db/mongodb.js');
const DeviceStatus = require('../models/device-status.js');
// const waamqp = require('../communication/waamqp.js');
const wamqtt = require('../communication/wamqtt.js');
const cfgRecHelper = require('../utils/cfgRecHelper.js');

const defaultHbtFreq = 5;

function __getDeviceStatus (ids, callback) {
  DeviceStatus.find({ _id: { $in: ids } }, function (err, results) {
    if (err) {
      callback(err);
    } else {
      let response = [];
      for (let i = 0; i < results.length; i++) {
        let result = results[i];
        let device = {
          id: result._id,
          status: (result && typeof result.status !== 'undefined') ? result.status : false,
          modified: (result && typeof result.modified !== 'undefined') ? result.modified : false,
          ts: (result) ? result.ts : new Date()
        };
        response.push(device);
      }
      callback(null, response);
    }
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

function _getDeviceStatus (ids, callback) {
  try {
    let params = [];
    if (Array.isArray(ids)) {
      params = ids;
    } else {
      params.push(ids);
    }
    __getDeviceStatus(params, callback);
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

/* function _insertDeviceStatus (param, callback) {
  DeviceStatus.create({
    _id: param.scadaId,
    status: param.status || false,
    modified: param.modified || false,
    freq: param.hbtFreq || defaultHbtFreq,
    ts: param.ts || new Date()
  }, (err, result) => {
    if (err) {
      callback(err);
      return;
    }
    let response = { ok: (result !== null) };
    callback(null, response);
  });
} */

function _updateDeviceStatus (id, param, callback) {
  let set = {};
  for (let key in param) {
    set[key] = param[key];
  }
  set.ts = param.ts || new Date();
  DeviceStatus.update({ _id: id }, set, (err, result) => {
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

function _upsertDeviceStatus (id, params, callback) {
  DeviceStatus.update({ _id: id }, {
    _id: id,
    status: params.status || false,
    freq: params.freq || defaultHbtFreq,
    modified: params.modified || false,
    ts: params.ts || new Date()
  }, { upsert: true }, (err, result) => {
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
  DeviceStatus.remove({ _id: id }, (err, result) => {
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
      _updateDeviceStatus(id, { modified: true }, (err, result) => {
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
      if (results[i].ok === true) {
        promises.push(_updateModifiedStatus(ids[i], false));
      }
    }
    Promise.all(promises)
    .then(() => {
      callback(null, results);
    })
    .catch((err) => {
      callback(err);
    });
  });
}

module.exports = {
  init: _init,
  quit: _quit,
  getDeviceStatus: _getDeviceStatus,
  // insertDeviceStatus: _insertDeviceStatus,
  updateDeviceStatus: _updateDeviceStatus,
  upsertDeviceStatus: _upsertDeviceStatus,
  deleteDeviceStatus: _deleteDeviceStatus,
  addModifiedConfigRecord: _addModifiedConfigRecord,
  syncDeviceConfig: _syncDeviceConfig
};

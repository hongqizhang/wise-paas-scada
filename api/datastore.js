'use strict';

const util = require('util');
const Promise = require('bluebird');

const mongodb = require('../db/mongodb.js');
const RealData = require('../models/real-data.js');
const HistData = require('../models/hist-data.js');

const DefaultMaxHistDataCount = 10000;

function __getRealData (scadaId, deviceId, tagName) {
  return new Promise((resolve, reject) => {
    let id = util.format('%s/%s/%s', scadaId, deviceId, tagName);
    RealData.findOne({ _id: id }, function (err, result) {
      if (err) {
        reject(err);
      } else {
        let data = {
          scadaId: scadaId,
          deviceId: deviceId,
          tagName: tagName,
          value: (result && typeof result.value !== 'undefined') ? result.value : '*',
          ts: (result && result.ts) ? result.ts : ''
        };
        resolve(data);
      }
    });
  });
}

function __updateRealData (param, options, callback) {
  try {
    let type = typeof param.value;
    if (param.value === null || type === 'undefined') {
      let err = 'value can not be null !';
      return callback(err);
    }

    let upsert = options.upsert || false;
    let id = util.format('%s/%s/%s', param.scadaId, param.deviceId, param.tagName);
    let ts = param.ts || new Date();

    if (type === 'object') {  // array tag
      RealData.findOne({ _id: id }, (err, result) => {
        if (err) {
          return callback(err);
        }
        if (upsert === false) {
          if (!result || !result.value) {
            let err = 'tag not found !';
            return callback(err);
          }
        }
        let newValue = (result && result.value && typeof result.value === 'object') ? result.value : {};
        for (var key in param.value) {
          newValue[key] = param.value[key];
        }
        RealData.update({ _id: id }, { value: newValue, ts: ts }, { upsert: upsert }, (err, result) => {
          if (err) {
            callback(err);
          }
          let response = { ok: false };
          if (result && result.n) {
            response.ok = (result.n === 1);
          }
          callback(null, response);
        });
      });
    } else {
      RealData.update({ _id: id }, { value: param.value, ts: ts }, { upsert: upsert }, (err, result) => {
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
  } catch (err) {
    callback(err);
  }
}

function _init (conf) {
  if (mongodb && mongodb.isConnected() === false && mongodb.isConnecting() === false) {
    mongodb.connect(conf);
  }
}

function _quit () {
  if (mongodb) {
    mongodb.disconnect();
  }
}

function _getRealData (obj, callback) {
  try {
    if (Array.isArray(obj)) {
      let promises = [];
      for (var i = 0; i < obj.length; i++) {
        let param = obj[i];
        promises.push(__getRealData.call(this, param.scadaId, param.deviceId, param.tagName));
      }
      Promise.all(promises)
      .then(function (results) {
        callback(null, results);
      })
      .catch(function (err) {
        callback(err);
      });
    } else {
      __getRealData.call(this, obj.scadaId, obj.deviceId, obj.tagName)
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

function _upsertRealData (param, callback) {
  __updateRealData(param, { upsert: true }, callback);
}

function _updateRealData (param, callback) {
  __updateRealData(param, { upsert: false }, callback);
}

function _deleteRealData (scadaId, callback) {
  if (!scadaId) {
    let err = 'scadaId can not be null !';
    callback(err);
    return;
  }
  let regex = new RegExp('^' + scadaId, 'i');
  RealData.remove({ _id: { $regex: regex } }, function (err, result) {
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

function _getHistData (param, callback) {
  let scadaId = param.scadaId;
  let deviceId = param.deviceId;
  let tagName = param.tagName;
  let startTs = param.startTs;
  let endTs = param.endTs;
  let orderby = param.orderby || 1;   // default is ASC
  let limit = (param.limit > DefaultMaxHistDataCount) ? DefaultMaxHistDataCount : param.limit;

  if ((startTs instanceof Date) === false) {
    startTs = new Date(startTs);
  }
  if ((endTs instanceof Date) === false) {
    endTs = new Date(endTs);
  }

  let id = util.format('%s/%s/%s', scadaId, deviceId, tagName);
  HistData
    .find({ id: id, ts: { '$gte': startTs, '$lt': endTs } })
    .sort({ 'ts': orderby })
    .limit(limit)
    .exec(function (err, results) {
      if (err) {
        return callback(err);
      }
      let outputs = [];
      results.forEach((result) => {
        let data = {
          scadaId: scadaId,
          deviceId: deviceId,
          tagName: tagName,
          value: (result && typeof result.value !== 'undefined') ? result.value : '*',
          ts: (result && result.ts) ? result.ts : new Date()
        };
        outputs.push(data);
      });
      callback(null, outputs);
    });
}

function _insertHistData (param, callback) {
  let type = typeof param.value;
  if (param.value === null || type === 'undefined') {
    let err = 'value can not be null !';
    callback(err);
    return;
  }

  let id = util.format('%s/%s/%s', param.scadaId, param.deviceId, param.tagName);
  let ts = param.ts || new Date();
  HistData.create({ _id: new mongodb.ObjectId(), id: id, value: param.value, ts: ts }, function (err, result) {
    if (err) {
      callback(err);
      return;
    }
    let response = { ok: false };
    if (result) {
      response.ok = true;
    }
    callback(null, response);
  });
}

module.exports = {
  init: _init,
  quit: _quit,
  getRealData: _getRealData,
  upsertRealData: _upsertRealData,
  updateRealData: _updateRealData,
  deleteRealData: _deleteRealData,
  getHistData: _getHistData,
  insertHistData: _insertHistData
};

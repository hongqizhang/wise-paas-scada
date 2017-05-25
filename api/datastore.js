'use strict';

const util = require('util');
const Promise = require('promise');

const mongodb = require('../db/mongodb.js');
const RealData = require('../models/real-data.js');
const HistData = require('../models/hist-data.js');

const DefaultMaxHistDataCount = 10000;

function _getRealData (scadaId, deviceId, tagName) {
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
          value: (result && result.value) ? result.value : '*',
          ts: (result && result.ts) ? result.ts : new Date()
        };
        resolve(data);
      }
    });
  });
}

function _getHistData (param) {
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

  return new Promise((resolve, reject) => {
    let id = util.format('%s/%s/%s', scadaId, deviceId, tagName);
    HistData
      .find({ id: id, ts: { '$gte': startTs, '$lt': endTs } })
      .sort({ 'ts': orderby })
      .limit(limit)
      .exec(function (err, results) {
        if (err) {
          reject(err);
        } else {
          let outputs = [];
          results.forEach((result) => {
            let data = {
              scadaId: scadaId,
              deviceId: deviceId,
              tagName: tagName,
              value: (result && result.value) ? result.value : '*',
              ts: (result && result.ts) ? result.ts : new Date()
            };
            outputs.push(data);
          });
          resolve(outputs);
        }
      });
  });
}

module.exports.init = (conf) => {
  if (mongodb && mongodb.isConnected() === false && mongodb.isConnecting() === false) {
    mongodb.connect(conf);
  }
};

module.exports.quit = () => {
  if (mongodb) {
    mongodb.disconnect();
  }
};

module.exports.getRealData = (params, callback) => {
  try {
    if (!Array.isArray(params)) {
      throw new Error('Input format is wrong !');
    }
    let promises = [];
    for (var i = 0; i < params.length; i++) {
      let param = params[i];
      promises.push(_getRealData.call(this, param.scadaId, param.deviceId, param.tagName));
    }

    Promise.all(promises)
    .then(function (results) {
      callback(null, results);
    })
    .catch(function (err) {
      callback(err);
    });
  } catch (err) {
    callback(err);
  }
};

module.exports.upsertRealData = (param, callback) => {
  if (param.value === null || typeof param.value === 'object') {
    let err = 'value can not be null !';
    callback(err);
    return;
  }

  let id = util.format('%s/%s/%s', param.scadaId, param.deviceId, param.tagName);
  RealData.update({ _id: id }, { id: id, value: param.value, ts: new Date() }, { upsert: true }, function (err, result) {
    if (err) {
      callback(err);
      return;
    }
    let response = { ok: false };
    if (result && result.n) {
      response.ok = (result.n === 1);
    }
    callback(null, response);
  });
};

module.exports.updateRealData = (param, callback) => {
  if (param.value === null || typeof param.value === 'object') {
    let err = 'value can not be null !';
    callback(err);
    return;
  }

  if (mongodb && mongodb.isConnected()) {
    let id = util.format('%s/%s/%s', param.scadaId, param.deviceId, param.tagName);
    RealData.update({ _id: id }, { value: param.value, ts: new Date() }, { upsert: false }, function (err, result) {
      if (err) {
        callback(err);
        return;
      }
      let response = { ok: false };
      if (result && result.n) {
        response.ok = (result.n === 1);
      }
      callback(null, response);
    });
  }
};

module.exports.deleteRealDataByScadaId = (scadaId, callback) => {
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
};

module.exports.getHistData = (param, callback) => {
  _getHistData.call(this, param)
    .then(function (results) {
      callback(null, results);
    })
    .catch(function (err) {
      callback(err);
    });
};

module.exports.insertHistData = (param, callback) => {
  if (param.value === null || typeof param.value === 'object') {
    let err = 'value can not be null !';
    callback(err);
    return;
  }

  let id = util.format('%s/%s/%s', param.scadaId, param.deviceId, param.tagName);
  HistData.create({ _id: new mongodb.ObjectId(), id: id, value: param.value, ts: param.ts }, function (err, result) {
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
};

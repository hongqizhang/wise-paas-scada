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
        return;
      }
      let data = {
        scadaId: scadaId,
        deviceId: deviceId,
        tagName: tagName,
        value: (result && typeof result.value !== 'undefined') ? result.value : '*',
        ts: (result && result.ts) ? result.ts : new Date()
      };
      resolve(data);
    });
  });
}

function _updateRealData (scadaId, deviceId, tagName, value, ts) {
  return new Promise((resolve, reject) => {
    let id = util.format('%s/%s/%s', scadaId, deviceId, tagName);
    RealData.update({ _id: id }, { value: value, ts: ts }, { upsert: false }, function (err, result) {
      if (err) {
        reject(err);
        return;
      }
      let response = { ok: false };
      if (result && result.n) {
        response.ok = (result.n === 1);
      }
      resolve(response);
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
          return;
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
        resolve(outputs);
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

module.exports.getRealData = (obj, callback) => {
  try {
    let promises = [];
    if (Array.isArray(obj)) {
      for (var i = 0; i < obj.length; i++) {
        let param = obj[i];
        promises.push(_getRealData.call(this, param.scadaId, param.deviceId, param.tagName));
      }
    } else {
      promises.push(_getRealData.call(this, obj.scadaId, obj.deviceId, obj.tagName));
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
  let type = typeof param.value;
  if (param.value === null || type === 'undefined') {
    let err = 'value can not be null !';
    callback(err);
    return;
  }
  /* if (Array.isArray(param.value)) {
    let err = 'value format is wrong !';
    callback(err);
    return;
  } */

  let id = util.format('%s/%s/%s', param.scadaId, param.deviceId, param.tagName);
  let ts = param.ts || new Date();

  RealData.update({ _id: id }, { value: param.value, ts: ts }, { upsert: true }, (err, result) => {
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

  /* if (type === 'object') {   // array tag
    RealData.findOne({ _id: id }, (err, result) => {
      if (err) {
        callback(err);
      } else {
        let newValue = (result && result.value && Array.isArray(result.value)) ? result.value : [];
        for (let key in param.value) {
          newValue[parseInt(key) - 1] = param.value[key];
        }
        RealData.update({ _id: id }, { value: newValue, ts: ts }, { upsert: true }, (err, result) => {
          if (err) {
            callback(err);
          }
          let response = { ok: false };
          if (result && result.n) {
            response.ok = (result.n === 1);
          }
          callback(null, response);
        });
      }
    });
  } else {
    RealData.update({ _id: id }, { value: param.value, ts: ts }, { upsert: true }, (err, result) => {
      if (err) {
        callback(err);
      }
      let response = { ok: false };
      if (result && result.n) {
        response.ok = (result.n === 1);
      }
      callback(null, response);
    });
  } */
};

module.exports.updateRealData = (param, callback) => {
  try {
    let value = param.value;
    if (typeof value !== 'number' && typeof value !== 'string' && Array.isArray(value) === false) {
      let err = 'value can not be null !';
      callback(err);
      return;
    }

    let id = util.format('%s/%s/%s', param.scadaId, param.deviceId, param.tagName);
    let ts = param.ts || new Date();

    if (Array.isArray(value)) {   // array tag
      RealData.findOne({ _id: id }, (err, result) => {
        if (err) {
          callback(err);
          return;
        }
        let newValue = (result && result.value && Array.isArray(result.value)) ? result.value : [];
        for (var key in param.value) {
          newValue[key] = param.value[key];
        }
        RealData.update({ _id: id }, { value: newValue, ts: ts }, { upsert: false }, (err, result) => {
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
      RealData.update({ _id: id }, { value: param.value, ts: ts }, { upsert: false }, (err, result) => {
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
  } catch (err) {
    callback(err);
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
  let value = param.value;
  if (typeof value !== 'number' && typeof value !== 'string' && Array.isArray(value) === false) {
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
};

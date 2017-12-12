'use strict';

const Promise = require('bluebird');

const constant = require('../common/const');
const mongodb = require('../db/mongodb');
const wamqtt = require('../communication/wamqtt');
const realDataHelper = require('../utils/realDataHelper');
const histDataHelper = require('../utils/histDataHelper');
const scadaCmdHelper = require('../utils/scadaCmdHelper');

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
  if (mongodb) {
    mongodb.disconnect();
  }
}

function _getRealData (param, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    try {
      let params = [];
      if (Array.isArray(param)) {
        params = param;
      } else {
        params.push(param);
      }
      realDataHelper.getRealData(params, (err, result) => {
        (err) ? reject(err) : resolve(result);
        callback(err, result);
      });
    } catch (err) {
      reject(err);
      callback(err);
    }
  });
}

function _upsertRealData (scadaId, params, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    realDataHelper.updateRealData(scadaId, params, { upsert: true }, (err) => {
      (err) ? reject(err) : resolve();
      callback(err);
    });
  });
}

function _updateRealData (scadaId, params, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    realDataHelper.updateRealData(scadaId, params, { upsert: false }, (err) => {
      (err) ? reject(err) : resolve();
      callback(err);
    });
  });
}

function _deleteRealData (scadaId, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    realDataHelper.deleteRealData(scadaId, (err) => {
      (err) ? reject(err) : resolve();
      callback(err);
    });
  });
}

function _getHistRawData (param, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    try {
      let tags = param.tags;
      let startTs = param.startTs;
      let endTs = param.endTs;
      let orderby = param.orderby || 1;   // default is ASC
      let limit = param.limit || 0;

      if (!tags || tags.length === 0) {
        let err = new Error('The tag can bot be null !');
        reject(err);
        return callback(err);
      }

      if (!startTs || startTs instanceof Date === false) {
        let err = new Error('The format of start time must be Date !');
        reject(err);
        return callback(err);
      }

      if (!endTs || endTs instanceof Date === false) {
        let err = new Error('The format of end time must be Date !');
        reject(err);
        return callback(err);
      }

      Promise.map(tags, (tag) => {
        return histDataHelper.getHistRawData({
          scadaId: tag.scadaId,
          deviceId: tag.deviceId,
          tagName: tag.tagName,
          startTs: startTs,
          endTs: endTs,
          orderby: orderby,
          limit: limit
        });
      }).then((results) => {
        let total = results.reduce((sum, result) => {
          if (result && result.values && result.values.length > 0) {
            return sum + result.values.length;
          } else {
            return sum;
          }
        }, 0);
        let response = { totalCount: total, rawData: results };
        resolve(response);
        callback(null, response);
      })
        .catch((err) => {
          reject(err);
          callback(err);
        });
    } catch (err) {
      reject(err);
      callback(err);
    }
  });
}

/**
 * Fetch the processed history data. There are four data type and four interval type.
 *  - intervalType: : secord, minute, hour, day
 *  - dataType: last, min, max, avg
 *
 * @param {param.tags} Tag name of the specified SCADA, it can be single or multiple tag name.
 * @param {param.startTs} The start time (Date object) of the result-set.
 * @param {param.orderby} Used to sort the result-set by time in ascending(1) or descending order(-1).
 * @param {param.limit} Specify the maximum number of the result-set.
 */
function _getHistDataLog (param, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    try {
      let tags = param.tags;
      let startTs = param.startTs;
      let endTs = new Date();
      let interval = param.interval || 1;
      let orderby = param.orderby || 1;   // default is ASC
      let limit = param.limit;
      let intervalType = param.intervalType || constant.intervalType.second;  // 'S', 'M', 'H', 'D'
      let dataType = param.dataType || constant.dataType.last;   // 'LAST', 'MIN', 'MAX', 'AVG'

      if (!tags || tags.length === 0) {
        let err = new Error('The tag can bot be null !');
        reject(err);
        return callback(err);
      }

      if (!startTs || startTs instanceof Date === false) {
        let err = new Error('The format of start time must be Date !');
        reject(err);
        return callback(err);
      }

      if (!limit || Number.isInteger(limit) === false || limit < 0) {
        let err = new Error('The limit must be positive !');
        reject(err);
        return callback(err);
      }

      switch (intervalType) {
        case constant.intervalType.second:
          endTs.setTime(startTs.getTime() + interval * limit * 1000);
          break;
        case constant.intervalType.minute:
          return callback(new Error('No support currently !'));
          break;
        case constant.intervalType.hour:
          return callback(new Error('No support currently !'));
          break;
        case constant.intervalType.day:
          return callback(new Error('No support currently !'));
          break;
      }
      Promise.map(tags, (tag) => {
        return histDataHelper.getHistRawData({
          scadaId: tag.scadaId,
          deviceId: tag.deviceId,
          tagName: tag.tagName,
          startTs: startTs,
          endTs: endTs,
          orderby: orderby,
          limit: limit,
          interval: interval,
          filled: true
        });
      }).then((results) => {
        let response = { dataLog: results };
        resolve(response);
        callback(null, response);
      })
        .catch((err) => {
          reject(err);
          callback(err);
        });
    } catch (err) {
      reject(err);
      callback(err);
    }
  });
}

function _insertHistRawData (params, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    if (!params || params.length === 0) {
      let err = new Error('data can not be null !');
      reject(err);
      callback(err);
    }
    histDataHelper.insertHistRawData(params, (err) => {
      (err) ? reject(err) : resolve();
      callback(err);
    });
  });
}

function _writeTagValue (params, callback) {
  callback = callback || function () { };
  return new Promise((resolve, reject) => {
    if (!params) {
      let err = new Error('input can not be null !');
      reject(err);
      return callback(err);
    }
    scadaCmdHelper.writeTagValue(params, (err) => {
      (err) ? reject(err) : resolve();
      callback(err);
    });
  });
}

module.exports = {
  init: _init,
  quit: _quit,
  // real data
  getRealData: _getRealData,
  upsertRealData: _upsertRealData,
  updateRealData: _updateRealData,
  deleteRealData: _deleteRealData,
  writeTagValue: _writeTagValue,
  // hist data
  getHistRawData: _getHistRawData,
  getHistDataLog: _getHistDataLog,
  insertHistRawData: _insertHistRawData
};

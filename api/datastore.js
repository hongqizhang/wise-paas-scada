'use strict';

const Promise = require('bluebird');

const constant = require('../common/const');
const mongodb = require('../db/mongodb');
const wamqtt = require('../communication/wamqtt');
const realDataHelper = require('../common/realDataHelper');
const histDataHelper = require('../common/histDataHelper');
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
  try {
    let params = [];
    if (Array.isArray(param)) {
      params = param;
    } else {
      params.push(param);
    }
    realDataHelper.getRealData(params, callback);
  } catch (err) {
    callback(err);
  }
}

function _upsertRealData (scadaId, params, callback) {
  realDataHelper.updateRealData(scadaId, params, { upsert: true }, callback);
}

function _updateRealData (scadaId, params, callback) {
  realDataHelper.updateRealData(scadaId, params, { upsert: false }, callback);
}

function _deleteRealData (scadaId, callback) {
  realDataHelper.deleteRealData(scadaId, callback);
}

function _getHistRawData (param, callback) {
  try {
    let tags = param.tags;
    let startTs = param.startTs;
    let endTs = param.endTs;
    let orderby = param.orderby || 1;   // default is ASC
    let limit = param.limit || 0;

    if (!tags || tags.length === 0) {
      return callback(new Error('The tag can bot be null !'));
    }

    if (!startTs || startTs instanceof Date === false) {
      return callback(new Error('The format of start time must be Date !'));
    }

    if (!endTs || endTs instanceof Date === false) {
      return callback(new Error('The format of end time must be Date !'));
    }

    Promise.map(tags, (tag) => {
      return histDataHelper.getHistRawData({
        scadaId: tag.scadaId,
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
      callback(null, { totalCount: total, rawData: results });
    })
    .catch((err) => {
      callback(err);
    });
  } catch (ex) {
    callback(ex);
  }
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
  try {
    let tags = param.tags;
    let startTs = param.startTs;
    let endTs = new Date();
    let interval = param.interval || 1;
    let orderby = param.orderby || 1;   // default is ASC
    let limit = param.limit || 0;
    let intervalType = param.intervalType || constant.intervalType.second;  // 'S', 'M', 'H', 'D'
    let dataType = param.dataType || constant.dataType.last;   // 'LAST', 'MIN', 'MAX', 'AVG'

    if (!tags || tags.length === 0) {
      return callback(new Error('The tag can bot be null !'));
    }

    if (!startTs || startTs instanceof Date === false) {
      return callback(new Error('The format of start time must be Date !'));
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
        tagName: tag.tagName,
        startTs: startTs,
        endTs: endTs,
        orderby: orderby,
        limit: limit,
        interval: interval,
        filled: true
      });
    }).then((results) => {
      callback(null, { dataLog: results });
    })
    .catch((err) => {
      callback(err);
    });
  } catch (ex) {
    callback(ex);
  }
}

function _insertHistRawData (params, callback) {
  if (!params || params.length === 0) {
    callback(new Error('data can not be null !'));
  }
  histDataHelper.insertHistRawData(params, callback);
}

function _writeTagValue (param, callback) {
  let type = typeof param.value;
  if (param.value === null || type === 'undefined') {
    return callback(new Error('value can not be null !'));
  }

  scadaCmdHelper.writeTagValue(param, callback);
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

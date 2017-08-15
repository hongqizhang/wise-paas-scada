'use strict';

const util = require('util');
const Promise = require('bluebird');

const constant = require('../common/const.js');
const mongodb = require('../db/mongodb.js');
const wamqtt = require('../communication/wamqtt.js');
const RealData = require('../models/real-data.js');
const HistData = require('../models/hist-data.js');
const scadaCmdHelper = require('../utils/scadaCmdHelper.js');

const DefaultMaxHistDataCount = 10000;

function __getRealData (params, callback) {
  let scadas = (params.map(item => item.scadaId));
  let selection = {};
  params.forEach((param) => {
    selection['tags.' + param.tagName] = 1;
  });
  RealData.find({ _id: { $in: scadas } }, selection, (err, results) => {
    if (err) {
      callback(err);
    } else {
      params.forEach((param) => {
        let tag = {};
        let doc = results.find(o => o._id === param.scadaId);
        if (doc && doc.tags && doc.tags[param.tagName]) {
          tag = doc.tags[param.tagName];
        }
        param.value = (typeof tag.value !== 'undefined') ? tag.value : constant.badTagValue;
        param.ts = tag.ts || '';
      });

      callback(null, params);
    }
  });
}

function __updateRealData (scadaId, params, options, callback) {
  try {
    if (Array.isArray(params) === false) {
      params = [params];
    }

    if (!scadaId || typeof scadaId !== 'string') {
      let err = 'scadaId can not be null !';
      return callback(err);
    }

    if (params.length === 0) {
      let err = 'input can not be null !';
      return callback(err);
    }

    let upsert = options.upsert || false;
    RealData.findOneAndUpdate({ _id: scadaId }, { $setOnInsert: { tags: {} } }, { upsert: upsert, new: true }, (err, doc) => {
      if (err) {
        return callback(err);
      }
      if (!doc) {
        return callback(new Error(util.format('SCADA [%s] does not exist', scadaId)));
      }

      for (let i = 0; i < params.length; i++) {
        let param = params[i];
        if (typeof params[i].value === 'object') {   // for array tag
          let newValue = {};
          if (doc.tags[param.tagName] && doc.tags[param.tagName].value && typeof doc.tags[param.tagName].value === 'object') {
            newValue = doc.tags[param.tagName].value;
          }
          for (var key in param.value) {
            newValue[key] = param.value[key];
          }
          param.value = newValue;
        }
        doc.tags[param.tagName] = { value: param.value, ts: param.ts, opTS: new Date() };
      }
      RealData.collection.save(doc);
      callback();
    });

    /* var bulk = RealData.collection.initializeOrderedBulkOp();
    bulk.find({ _id: scadaId }).upsert().updateOne({ $pull: { tags: { name: { $in: tagNamelist } } } });
    bulk.find({ _id: scadaId }).updateOne({ $push: { tags: { $each: params } } });
    bulk.execute();

    callback(); */

    /* RealData.update({ _id: scadaId }, {
      $pull: { tags: { name: { $in: tagNamelist } } }
    }, { upsert: upsert }, (err, result) => {
      if (err) {
        return callback(err);
      }

      RealData.update({ _id: scadaId }, {
        $push: { tags: { $each: params } }
      }, (err, result) => {
        if (err) {
          return callback(err);
        }

        let response = { ok: false };
        if (result && result.n) {
          response.ok = (result.n === 1);
        }
        callback(null, response);
      });
    }); */

    /* if (type === 'object') {  // array tag
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
    } */
  } catch (err) {
    callback(err);
  }
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
  if (mongodb) {
    mongodb.disconnect();
  }
}

function _getRealData (obj, callback) {
  try {
    let params = [];
    if (Array.isArray(obj)) {
      params = obj;
    } else {
      params.push(obj);
    }
    __getRealData(params, callback);
  } catch (err) {
    callback(err);
  }
}

function _upsertRealData (scadaId, params, callback) {
  __updateRealData(scadaId, params, { upsert: true }, callback);
}

function _updateRealData (scadaId, params, callback) {
  __updateRealData(scadaId, params, { upsert: false }, callback);
}

function _deleteRealData (scadaId, callback) {
  if (!scadaId) {
    let err = 'scadaId can not be null !';
    callback(err);
    return;
  }
  let regex = new RegExp('^' + scadaId, 'i');
  RealData.remove({ _id: { $regex: regex } }, (err, result) => {
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

function _getHistRawData (param, callback) {
  let scadaId = param.scadaId;
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

  HistData
    .find({ scadaId: scadaId, tagName: tagName, ts: { '$gte': startTs, '$lt': endTs } })
    .sort({ 'ts': orderby })
    .limit(limit)
    .exec((err, results) => {
      if (err) {
        return callback(err);
      }
      callback(null, results);
    });
}

function _insertHistData (scadaId, params, ts, callback) {
  if (!params || params.length === 0) {
    let err = 'data can not be null !';
    callback(err);
    return;
  }

  let tags = {};
  for (let i = 0; i < params.length; i++) {
    let param = params[i];
    tags[param.tagName] = param.value;
  }
  HistData.create({ _id: new mongodb.ObjectId(), id: scadaId, tags: tags, ts: ts }, (err) => {
    if (err) {
      return callback(err);
    }
    callback();
  });
  /* HistData.insertMany(params, (err, result) => {
    if (err) {
      callback(err);
      return;
    }
    let response = { ok: false };
    if (result) {
      response.ok = true;
    }
    callback(null, response);
  }); */
}

function _writeTagValue (param, callback) {
  let type = typeof param.value;
  if (param.value === null || type === 'undefined') {
    let err = 'value can not be null !';
    return callback(err);
  }

  scadaCmdHelper.writeTagValue(param, callback);
}

module.exports = {
  init: _init,
  quit: _quit,
  getRealData: _getRealData,
  upsertRealData: _upsertRealData,
  updateRealData: _updateRealData,
  // deleteRealData: _deleteRealData,
  getHistRawData: _getHistRawData,
  insertHistData: _insertHistData,
  writeTagValue: _writeTagValue
};
